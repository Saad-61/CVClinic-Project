import re

# Broad curated skill list for CV and job-description extraction.
# This is not literally every skill, but it covers the main software, AI,
# data, cloud, DevOps, product, and soft-skill terms commonly seen in this project.
SKILL_KEYWORDS = [
    # Languages
    "python",
    "java",
    "c",
    "c++",
    "c#",
    "javascript",
    "typescript",
    "go",
    "golang",
    "rust",
    "php",
    "ruby",
    "swift",
    "kotlin",
    "scala",
    "r",
    "matlab",
    "sql",
    "bash",
    "powershell",

    # Frontend
    "html",
    "css",
    "sass",
    "scss",
    "tailwindcss",
    "bootstrap",
    "react",
    "next.js",
    "vue",
    "vue.js",
    "angular",
    "svelte",
    "redux",
    "zustand",
    "graphql",

    # Backend / APIs
    "node.js",
    "express",
    "fastapi",
    "flask",
    "django",
    "spring boot",
    "nestjs",
    "rest",
    "rest api",
    "restful api",
    "api design",
    "microservices",
    "monolith",
    "authentication",
    "authorization",
    "jwt",
    "oauth",
    "oauth2",
    "microservice",

    # Databases / storage
    "mysql",
    "postgresql",
    "sqlite",
    "mongodb",
    "redis",
    "supabase",
    "duckdb",
    "firebase",
    "mariadb",
    "dynamodb",
    "elasticsearch",
    "vector database",

    # Data / analytics / ML / AI
    "machine learning",
    "deep learning",
    "artificial intelligence",
    "nlp",
    "natural language processing",
    "computer vision",
    "data science",
    "data analysis",
    "data engineering",
    "pandas",
    "numpy",
    "scikit-learn",
    "tensorflow",
    "pytorch",
    "keras",
    "transformers",
    "sentence transformers",
    "openai",
    "gemini",
    "prompt engineering",
    "embedding",
    "embeddings",
    "rag",
    "retrieval augmented generation",
    "llm",
    "large language model",

    # Data visualization / BI tools
    "tableau",
    "power bi",
    "powerbi",
    "matplotlib",
    "seaborn",
    "plotly",
    "looker",
    "metabase",
    "google data studio",
    "excel",
    "google sheets",

    # Data engineering / ETL / warehouse
    "etl",
    "elt",
    "airflow",
    "apache airflow",
    "dbt",
    "spark",
    "apache spark",
    "hadoop",
    "hive",
    "kafka",
    "apache kafka",
    "snowflake",
    "bigquery",
    "redshift",
    "data warehouse",
    "data lake",
    "data pipeline",
    "data modeling",
    "dbt core",
    "prefect",
    "luigi",

    # Statistics / analysis
    "statistics",
    "statistical analysis",
    "regression",
    "a/b testing",
    "hypothesis testing",
    "r language",

    # DevOps / cloud / deployment
    "aws",
    "amazon web services",
    "azure",
    "gcp",
    "google cloud",
    "cloud",
    "docker",
    "docker-compose",
    "kubernetes",
    "terraform",
    "ansible",
    "jenkins",
    "github actions",
    "ci/cd",
    "deployment",
    "render",
    "railway",
    "vercel",
    "netlify",
    "linux",
    "ubuntu",

    # Testing / quality
    "testing",
    "unit testing",
    "integration testing",
    "end-to-end testing",
    "e2e testing",
    "pytest",
    "jest",
    "mocha",
    "chai",
    "cypress",
    "playwright",
    "selenium",
    "postman",
    "bug tracking",
    "debugging",
    "qa",
    "quality assurance",

    # Version control / collaboration
    "git",
    "github",
    "gitlab",
    "bitbucket",
    "code review",
    "agile",
    "scrum",
    "kanban",
    "jira",
    "confluence",

    # Security / performance / architecture
    "security",
    "application security",
    "encryption",
    "rate limiting",
    "caching",
    "performance optimization",
    "scalability",
    "system design",
    "architecture",
    "load balancing",
    "observability",
    "logging",
    "monitoring",
    "tracing",

    # Product / process / soft skills
    "communication",
    "teamwork",
    "leadership",
    "problem solving",
    "critical thinking",
    "time management",
    "adaptability",
    "collaboration",
    "presentation",
    "stakeholder management",
    "project management",
    "documentation",
    "research",
]


# ---------------------------------------------------------------------------
# SKILL_ALIASES  –  ALL keys MUST be lowercase so that the cleaned-text
# lookup (which always produces lowercase) matches them reliably.
#
# Each value should be the canonical form that appears (or maps to something)
# in SKILL_KEYWORDS.  Duplicated self-mappings are harmless but avoided here.
# ---------------------------------------------------------------------------
SKILL_ALIASES = {
    # ── Languages ──────────────────────────────────────────────
    "py":                       "python",
    "python3":                  "python",
    "cpp":                      "c++",
    "c plus plus":              "c++",
    "csharp":                   "c#",
    "c sharp":                  "c#",
    "js":                       "javascript",
    "es6":                      "javascript",
    "es2015":                   "javascript",
    "ts":                       "typescript",
    "golang":                   "go",

    # ── Frontend ───────────────────────────────────────────────
    "reactjs":                  "react",
    "react.js":                 "react",
    "next.js":                  "next.js",
    "nextjs":                   "next.js",
    "nuxt":                     "vue.js",
    "nuxtjs":                   "vue.js",
    "nuxt.js":                  "vue.js",
    "vuejs":                    "vue.js",
    "vue":                      "vue",
    "tailwind":                 "tailwindcss",
    "tailwind css":             "tailwindcss",

    # ── Backend / APIs ─────────────────────────────────────────
    "node":                     "node.js",
    "nodejs":                   "node.js",
    "node js":                  "node.js",
    "rest api":                 "rest api",
    "restful api":              "restful api",
    "restful":                  "rest api",
    "apis":                     "api design",
    "api":                      "api design",
    "oauth 2":                  "oauth2",
    "spring":                   "spring boot",

    # ── Databases ──────────────────────────────────────────────
    "postgres":                 "postgresql",
    "postgresql":               "postgresql",    # self-map; canonical already
    "postgre sql":              "postgresql",
    "mysql db":                 "mysql",
    "mongo":                    "mongodb",
    "mongo db":                 "mongodb",
    "elastic":                  "elasticsearch",
    "elastic search":           "elasticsearch",
    "vector db":                "vector database",

    # ── ML / AI ────────────────────────────────────────────────
    "ai":                       "artificial intelligence",
    "gen ai":                   "artificial intelligence",
    "genai":                    "artificial intelligence",
    "ml":                       "machine learning",
    "dl":                       "deep learning",
    "cv":                       "computer vision",
    "nlp":                      "natural language processing",
    "llms":                     "llm",
    "large language models":    "large language model",
    "retrieval augmented generation": "rag",
    "sklearn":                  "scikit-learn",
    "scikit learn":             "scikit-learn",
    "sentence-transformers":    "sentence transformers",
    "huggingface":              "transformers",
    "hugging face":             "transformers",
    "openai api":               "openai",
    "gpt":                      "openai",
    "gpt-4":                    "openai",
    "chatgpt":                  "openai",
    "gemini api":               "gemini",
    "prompt":                   "prompt engineering",

    # ── DevOps / Cloud ─────────────────────────────────────────
    "amazon web services":      "aws",
    "google cloud platform":    "gcp",
    "google cloud":             "gcp",
    "azure cloud":              "azure",
    "docker compose":           "docker-compose",
    "k8s":                      "kubernetes",
    "github action":            "github actions",
    "gh actions":               "github actions",
    "ci cd":                    "ci/cd",
    "cicd":                     "ci/cd",
    "continuous integration":   "ci/cd",
    "continuous deployment":    "ci/cd",
    "cd":                       "ci/cd",

    # ── Testing ────────────────────────────────────────────────
    "unit test":                "unit testing",
    "integration test":         "integration testing",
    "e2e":                      "e2e testing",
    "end to end":               "end-to-end testing",

    # ── Misc ───────────────────────────────────────────────────
    "graphql api":              "graphql",
    "nosql":                    "mongodb",
    "version control":          "git",
    "source control":           "git",

    # ── Data / BI / Analytics ──────────────────────────────────
    "power bi":                 "power bi",
    "ms excel":                 "excel",
    "microsoft excel":          "excel",
    "google sheets":            "google sheets",
    "data studio":              "google data studio",
    "looker studio":            "google data studio",
    "apache spark":             "spark",
    "apache kafka":             "kafka",
    "apache airflow":           "airflow",
    "dbt core":                 "dbt",
    "a b testing":              "a/b testing",
    "ab testing":               "a/b testing",
    "statistical":              "statistics",
    "data wrangling":           "data analysis",
    "data cleaning":            "data analysis",
    "r programming":            "r language",
    "r studio":                 "r language",
    "rstudio":                  "r language",
}


def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s+.#/-]", " ", text)  # keep tech chars
    text = text.replace("/", " ")
    text = text.replace("-", " ")
    text = re.sub(r"\s+", " ", text)
    return text


def normalize_skill(skill: str) -> str:
    """
    Return the canonical form of a skill string.

    Lookup order:
      1. cleaned-lowercase key in SKILL_ALIASES   → alias target
      2. fallback → lowercased original
    """
    cleaned = clean_text(skill).strip()
    return SKILL_ALIASES.get(cleaned, skill.lower())


def _term_pattern(term: str) -> str:
    cleaned = clean_text(term).strip()
    escaped = re.escape(cleaned).replace(r"\ ", r"\s+")
    return rf"(?<![a-z0-9+#.]){escaped}(?![a-z0-9+#.])"


def extract_skills(text: str) -> list[str]:
    """
    Extract and normalise all recognised skills from *text*.

    Returns a sorted list of canonical skill names with no duplicates.
    """
    cleaned_text = clean_text(text)

    found_skills: set[str] = set()
    # Search for every keyword *and* every alias key
    terms = [*SKILL_KEYWORDS, *SKILL_ALIASES.keys()]

    for skill in terms:
        # Special handling for single-character skills to avoid coincidental matches
        if skill == "c":
            # Match C/c but exclude common non-programming uses
            c_matches = re.finditer(r"\b[Cc]\b", text)
            has_valid_c = False
            for m in c_matches:
                start = max(0, m.start() - 15)
                end = min(len(text), m.end() + 15)
                context = text[start:end].lower()
                if any(x in context for x in [
                    "c-level", "c level", "c-suite", "c suite", 
                    "vitamin c", "c/o", "c.v.", "c.o.", "grade c", 
                    "tier c", "c-class", "c class"
                ]):
                    continue
                has_valid_c = True
                break
            if has_valid_c:
                found_skills.add(normalize_skill("c"))
            continue

        elif skill == "r":
            # Match R/r but exclude common non-programming uses
            r_matches = re.finditer(r"\b[Rr]\b", text)
            has_valid_r = False
            for m in r_matches:
                start = max(0, m.start() - 15)
                end = min(len(text), m.end() + 15)
                context = text[start:end].lower()
                if any(x in context for x in [
                    "r&d", "r & d", "r-level", "r-value", "r-squared", 
                    "r squared", "r-type", "r.d.", "register", "registered"
                ]):
                    continue
                has_valid_r = True
                break
            if has_valid_r:
                found_skills.add(normalize_skill("r"))
            continue

        pattern = _term_pattern(skill)
        if re.search(pattern, cleaned_text):
            found_skills.add(normalize_skill(skill))

    return sorted(found_skills)
