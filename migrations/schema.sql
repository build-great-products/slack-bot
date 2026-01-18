--
-- PostgreSQL database dump
--

\restrict xxx


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: slack_installation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.slack_installation (
    id text NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    value text NOT NULL
);


--
-- Name: slack_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.slack_user (
    slack_workspace_id text NOT NULL,
    slack_user_id text NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    slack_workspace_url text NOT NULL,
    rough_user_id text NOT NULL,
    rough_workspace_id text NOT NULL,
    rough_workspace_public_id text NOT NULL,
    name text NOT NULL,
    access_token text NOT NULL,
    access_token_expires_at bigint NOT NULL,
    refresh_token text NOT NULL
);


--
-- Name: slack_user_oauth; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.slack_user_oauth (
    state text NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    slack_user_id text NOT NULL,
    slack_workspace_id text NOT NULL,
    slack_workspace_url text NOT NULL,
    code_verifier text NOT NULL,
    slack_response_url text
);


--
-- Name: slack_installation slack_installation:primaryKey(id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slack_installation
    ADD CONSTRAINT "slack_installation:primaryKey(id)" PRIMARY KEY (id);


--
-- Name: slack_user slack_user:primaryKey(slack_workspace_id,slack_user_id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slack_user
    ADD CONSTRAINT "slack_user:primaryKey(slack_workspace_id,slack_user_id)" PRIMARY KEY (slack_workspace_id, slack_user_id);


--
-- Name: slack_user_oauth slack_user_oauth:primaryKey(state); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slack_user_oauth
    ADD CONSTRAINT "slack_user_oauth:primaryKey(state)" PRIMARY KEY (state);


--
-- PostgreSQL database dump complete
--

\unrestrict xxx

