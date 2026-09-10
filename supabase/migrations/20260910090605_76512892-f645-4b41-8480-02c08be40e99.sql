
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','investigator','coordinator','site_staff','sponsor','participant');
CREATE TYPE public.study_status AS ENUM ('draft','recruiting','active','paused','closed');
CREATE TYPE public.candidate_status AS ENUM ('suggested','under_review','contacted','consented','screen_failed','ineligible','enrolled','withdrawn');
CREATE TYPE public.consent_status AS ENUM ('not_started','sent','granted','declined','revoked','expired');
CREATE TYPE public.visit_status AS ENUM ('scheduled','completed','missed','cancelled');
CREATE TYPE public.task_status AS ENUM ('open','in_progress','done','blocked');
CREATE TYPE public.job_status AS ENUM ('pending','processing','sent','failed','dead_letter');

-- ORGANIZATIONS
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'research_institute',
  plan text NOT NULL DEFAULT 'trial',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- HELPERS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT org_id FROM public.profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- STUDIES
CREATE TABLE public.studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  sponsor text NOT NULL DEFAULT '',
  phase text NOT NULL DEFAULT 'II',
  therapeutic_area text NOT NULL DEFAULT '',
  status public.study_status NOT NULL DEFAULT 'draft',
  protocol_version text NOT NULL DEFAULT 'v1.0',
  criteria_updated_at timestamptz NOT NULL DEFAULT now(),
  target_enrollment integer NOT NULL DEFAULT 50,
  summary text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studies TO authenticated;
GRANT ALL ON public.studies TO service_role;
ALTER TABLE public.studies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER studies_updated BEFORE UPDATE ON public.studies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SITES
CREATE TABLE public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  study_id uuid REFERENCES public.studies(id) ON DELETE CASCADE,
  name text NOT NULL,
  city text NOT NULL DEFAULT '',
  weekly_capacity integer NOT NULL DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sites TO authenticated;
GRANT ALL ON public.sites TO service_role;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- CRITERIA
CREATE TABLE public.eligibility_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'inclusion',
  label text NOT NULL,
  attribute text NOT NULL,
  operator text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  weight numeric NOT NULL DEFAULT 1,
  hard boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eligibility_criteria TO authenticated;
GRANT ALL ON public.eligibility_criteria TO service_role;
ALTER TABLE public.eligibility_criteria ENABLE ROW LEVEL SECURITY;

-- PARTICIPANTS
CREATE TABLE public.participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  age integer,
  sex text NOT NULL DEFAULT 'unknown',
  city text NOT NULL DEFAULT '',
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  conditions text[] NOT NULL DEFAULT '{}',
  medications text[] NOT NULL DEFAULT '{}',
  contact_consent boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'registry',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.participants TO authenticated;
GRANT ALL ON public.participants TO service_role;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER participants_updated BEFORE UPDATE ON public.participants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CANDIDATES (screening pipeline)
CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  study_id uuid NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  status public.candidate_status NOT NULL DEFAULT 'suggested',
  match_score numeric NOT NULL DEFAULT 0,
  confidence text NOT NULL DEFAULT 'low',
  explanation jsonb NOT NULL DEFAULT '[]'::jsonb,
  screened_protocol_version text NOT NULL DEFAULT 'v1.0',
  criteria_snapshot_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (study_id, participant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT ALL ON public.candidates TO service_role;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER candidates_updated BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CONSENTS
CREATE TABLE public.consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  study_id uuid NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  status public.consent_status NOT NULL DEFAULT 'not_started',
  document_version text NOT NULL DEFAULT 'ICF v1.0',
  scope text[] NOT NULL DEFAULT ARRAY['screening'],
  granted_at timestamptz,
  revoked_at timestamptz,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (study_id, participant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consents TO authenticated;
GRANT ALL ON public.consents TO service_role;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER consents_updated BEFORE UPDATE ON public.consents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- VISITS
CREATE TABLE public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  study_id uuid NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
  visit_type text NOT NULL DEFAULT 'screening',
  scheduled_at timestamptz NOT NULL,
  status public.visit_status NOT NULL DEFAULT 'scheduled',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- TASKS
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  study_id uuid REFERENCES public.studies(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES public.participants(id) ON DELETE SET NULL,
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  due_at timestamptz,
  priority text NOT NULL DEFAULT 'normal',
  status public.task_status NOT NULL DEFAULT 'open',
  assignee uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- DOCUMENTS
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  study_id uuid REFERENCES public.studies(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES public.participants(id) ON DELETE SET NULL,
  title text NOT NULL,
  doc_type text NOT NULL DEFAULT 'protocol',
  storage_path text NOT NULL DEFAULT '',
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- NOTIFICATION / JOB QUEUE
CREATE TABLE public.job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  idempotency_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.job_status NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  last_error text NOT NULL DEFAULT '',
  next_run_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, idempotency_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_queue TO authenticated;
GRANT ALL ON public.job_queue TO service_role;
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER job_queue_updated BEFORE UPDATE ON public.job_queue FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- AUDIT LOG
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id uuid,
  actor_email text NOT NULL DEFAULT '',
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- OPTIMIZATION RUNS (classical / quantum-ready allocation)
CREATE TABLE public.optimization_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  study_id uuid NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  method text NOT NULL DEFAULT 'classical_qubo',
  backend text NOT NULL DEFAULT 'local_exact',
  objective numeric NOT NULL DEFAULT 0,
  qubo_size integer NOT NULL DEFAULT 0,
  runtime_ms integer NOT NULL DEFAULT 0,
  assignment jsonb NOT NULL DEFAULT '[]'::jsonb,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.optimization_runs TO authenticated;
GRANT ALL ON public.optimization_runs TO service_role;
ALTER TABLE public.optimization_runs ENABLE ROW LEVEL SECURITY;

-- POLICIES: org scoped
CREATE POLICY org_read ON public.organizations FOR SELECT TO authenticated USING (id = public.current_org_id());
CREATE POLICY org_update ON public.organizations FOR UPDATE TO authenticated USING (id = public.current_org_id() AND public.has_role(auth.uid(),'admin'));

CREATE POLICY profiles_self_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY profiles_org_read ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR org_id = public.current_org_id());

CREATE POLICY roles_self_read ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY studies_rw ON public.studies FOR ALL TO authenticated USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY sites_rw ON public.sites FOR ALL TO authenticated USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY criteria_rw ON public.eligibility_criteria FOR ALL TO authenticated USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY participants_rw ON public.participants FOR ALL TO authenticated USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY candidates_rw ON public.candidates FOR ALL TO authenticated USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY consents_rw ON public.consents FOR ALL TO authenticated USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY visits_rw ON public.visits FOR ALL TO authenticated USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY tasks_rw ON public.tasks FOR ALL TO authenticated USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY documents_rw ON public.documents FOR ALL TO authenticated USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY jobs_rw ON public.job_queue FOR ALL TO authenticated USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());
CREATE POLICY audit_read ON public.audit_log FOR SELECT TO authenticated USING (org_id = public.current_org_id());
CREATE POLICY audit_insert ON public.audit_log FOR INSERT TO authenticated WITH CHECK (org_id = public.current_org_id());
CREATE POLICY opt_rw ON public.optimization_runs FOR ALL TO authenticated USING (org_id = public.current_org_id()) WITH CHECK (org_id = public.current_org_id());

-- NEW USER BOOTSTRAP: join demo org, get coordinator role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE demo_org uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  INSERT INTO public.profiles (user_id, org_id, full_name, email)
  VALUES (NEW.id, demo_org, COALESCE(NEW.raw_user_meta_data->>'full_name',''), COALESCE(NEW.email,''))
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'coordinator')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED DEMO ORG
INSERT INTO public.organizations (id, name, kind, plan)
VALUES ('11111111-1111-1111-1111-111111111111','Swarnandhra Clinical Research Unit','academic_research_site','pilot');

INSERT INTO public.studies (id, org_id, code, title, sponsor, phase, therapeutic_area, status, protocol_version, target_enrollment, summary) VALUES
('22222222-2222-2222-2222-222222222221','11111111-1111-1111-1111-111111111111','TB-T2D-01','Adjunct GLP-1 therapy in adults with poorly controlled type 2 diabetes','Northline Pharma','III','Endocrinology','recruiting','v2.1',120,'Randomised open-label study evaluating an adjunct GLP-1 receptor agonist in adults with HbA1c between 7.5% and 10.5% on stable metformin.'),
('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','TB-HTN-04','Home blood-pressure telemonitoring in stage-2 hypertension','Swarnandhra Institute','II','Cardiology','recruiting','v1.3',80,'Operational study of coordinator-led home blood-pressure telemonitoring versus standard clinic follow-up in adults with stage-2 hypertension.');

INSERT INTO public.sites (id, org_id, study_id, name, city, weekly_capacity) VALUES
('33333333-3333-3333-3333-333333333331','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222221','Narsapur Site A','Narsapur',8),
('33333333-3333-3333-3333-333333333332','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222221','Bhimavaram Site B','Bhimavaram',5),
('33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','Rajahmundry Site C','Rajahmundry',6);

INSERT INTO public.eligibility_criteria (study_id, org_id, kind, label, attribute, operator, value, weight, hard) VALUES
('22222222-2222-2222-2222-222222222221','11111111-1111-1111-1111-111111111111','inclusion','Age 18-75 years','age','between','{"min":18,"max":75}',2,true),
('22222222-2222-2222-2222-222222222221','11111111-1111-1111-1111-111111111111','inclusion','HbA1c between 7.5% and 10.5%','hba1c','between','{"min":7.5,"max":10.5}',3,true),
('22222222-2222-2222-2222-222222222221','11111111-1111-1111-1111-111111111111','inclusion','BMI at least 25','bmi','gte','{"value":25}',1,false),
('22222222-2222-2222-2222-222222222221','11111111-1111-1111-1111-111111111111','inclusion','Diagnosed type 2 diabetes','conditions','includes','{"value":"type 2 diabetes"}',3,true),
('22222222-2222-2222-2222-222222222221','11111111-1111-1111-1111-111111111111','inclusion','On stable metformin','medications','includes','{"value":"metformin"}',2,false),
('22222222-2222-2222-2222-222222222221','11111111-1111-1111-1111-111111111111','exclusion','eGFR below 45','egfr','lt','{"value":45}',3,true),
('22222222-2222-2222-2222-222222222221','11111111-1111-1111-1111-111111111111','exclusion','Current pregnancy','conditions','includes','{"value":"pregnancy"}',3,true),
('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','inclusion','Age 30-80 years','age','between','{"min":30,"max":80}',2,true),
('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','inclusion','Systolic BP at least 140 mmHg','sbp','gte','{"value":140}',3,true),
('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','inclusion','Diagnosed hypertension','conditions','includes','{"value":"hypertension"}',3,true),
('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','inclusion','Owns a smartphone','attributes.smartphone','equals','{"value":true}',1,false),
('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','exclusion','Advanced chronic kidney disease','conditions','includes','{"value":"ckd stage 4"}',3,true);

INSERT INTO public.participants (org_id, code, display_name, age, sex, city, attributes, conditions, medications, contact_consent, source) VALUES
('11111111-1111-1111-1111-111111111111','P-0001','Registry record 0001',54,'female','Narsapur','{"hba1c":8.4,"bmi":29.1,"egfr":88,"sbp":132,"smartphone":true,"distance_km":6}','{"type 2 diabetes","dyslipidemia"}','{"metformin","atorvastatin"}',true,'registry'),
('11111111-1111-1111-1111-111111111111','P-0002','Registry record 0002',61,'male','Bhimavaram','{"hba1c":9.6,"bmi":27.4,"egfr":71,"sbp":148,"smartphone":true,"distance_km":18}','{"type 2 diabetes","hypertension"}','{"metformin","amlodipine"}',true,'registry'),
('11111111-1111-1111-1111-111111111111','P-0003','Registry record 0003',44,'female','Narsapur','{"hba1c":7.1,"bmi":24.2,"egfr":95,"sbp":118,"smartphone":true,"distance_km":3}','{"type 2 diabetes"}','{"metformin"}',true,'registry'),
('11111111-1111-1111-1111-111111111111','P-0004','Registry record 0004',68,'male','Rajahmundry','{"hba1c":8.9,"bmi":31.0,"egfr":41,"sbp":151,"smartphone":false,"distance_km":42}','{"type 2 diabetes","ckd stage 4"}','{"metformin","insulin glargine"}',false,'referral'),
('11111111-1111-1111-1111-111111111111','P-0005','Registry record 0005',36,'female','Narsapur','{"hba1c":8.1,"bmi":26.8,"egfr":102,"sbp":126,"smartphone":true,"distance_km":9}','{"type 2 diabetes","pregnancy"}','{"insulin aspart"}',true,'referral'),
('11111111-1111-1111-1111-111111111111','P-0006','Registry record 0006',59,'male','Narsapur','{"hba1c":10.1,"bmi":33.5,"egfr":66,"sbp":144,"smartphone":true,"distance_km":11}','{"type 2 diabetes","hypertension","obesity"}','{"metformin","telmisartan"}',true,'registry'),
('11111111-1111-1111-1111-111111111111','P-0007','Registry record 0007',72,'female','Bhimavaram','{"hba1c":7.8,"bmi":25.9,"egfr":58,"sbp":158,"smartphone":true,"distance_km":22}','{"type 2 diabetes","hypertension"}','{"metformin","losartan"}',true,'registry'),
('11111111-1111-1111-1111-111111111111','P-0008','Registry record 0008',48,'male','Rajahmundry','{"hba1c":6.4,"bmi":23.1,"egfr":99,"sbp":142,"smartphone":true,"distance_km":15}','{"hypertension"}','{"amlodipine"}',true,'registry'),
('11111111-1111-1111-1111-111111111111','P-0009','Registry record 0009',65,'female','Rajahmundry','{"hba1c":9.2,"bmi":28.7,"egfr":74,"sbp":163,"smartphone":true,"distance_km":7}','{"type 2 diabetes","hypertension"}','{"metformin","hydrochlorothiazide"}',true,'referral'),
('11111111-1111-1111-1111-111111111111','P-0010','Registry record 0010',33,'male','Narsapur','{"hba1c":8.7,"bmi":30.2,"egfr":91,"sbp":137,"smartphone":false,"distance_km":5}','{"type 2 diabetes"}','{}',false,'walk_in'),
('11111111-1111-1111-1111-111111111111','P-0011','Registry record 0011',79,'male','Bhimavaram','{"hba1c":8.0,"bmi":26.1,"egfr":63,"sbp":155,"smartphone":true,"distance_km":30}','{"hypertension","atrial fibrillation"}','{"apixaban","metoprolol"}',true,'registry'),
('11111111-1111-1111-1111-111111111111','P-0012','Registry record 0012',51,'female','Narsapur','{"hba1c":9.9,"bmi":34.8,"egfr":80,"sbp":149,"smartphone":true,"distance_km":4}','{"type 2 diabetes","hypertension","obesity"}','{"metformin","ramipril"}',true,'registry');
