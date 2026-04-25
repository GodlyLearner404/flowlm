🔥 1. prompts
Purpose:

Logical container (name, description)

id (UUID, PK)
name (TEXT)
description (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
🧠 Why separate?

Because:

Prompt = identity  
PromptVersion = actual logic


🔥 2. prompt_versions
Purpose:

Actual working prompt

id (UUID, PK)
prompt_id (FK → prompts.id)

version_number (INT)

template (TEXT)
variables (JSONB)

model (TEXT)
config (JSONB)   -- temperature, top_p etc

created_at (TIMESTAMP)
🧠 Example config
{
  "temperature": 0.7,
  "max_tokens": 200
}
⚠️ Important constraint
(prompt_id, version_number) must be unique


🔥 3. datasets
Purpose:

Dataset container

id (UUID, PK)
name (TEXT)
description (TEXT)

created_at (TIMESTAMP)


🔥 4. dataset_items
Purpose:

Individual test cases

id (UUID, PK)
dataset_id (FK → datasets.id)

input (JSONB)
expected_output (TEXT)

created_at (TIMESTAMP)
🧠 Example
input: { "topic": "recursion" }
expected_output: "function calling itself"


🔥 5. experiments
Purpose:

A full evaluation run setup

id (UUID, PK)

prompt_version_id (FK → prompt_versions.id)
dataset_id (FK → datasets.id)

status (TEXT)   -- pending, running, completed

created_at (TIMESTAMP)
🧠 Think of this as:
“Run this prompt version on this dataset”


🔥 6. runs (MOST IMPORTANT TABLE)
Purpose:

Each individual LLM execution

id (UUID, PK)

experiment_id (FK → experiments.id)

dataset_item_id (FK → dataset_items.id)

input (JSONB)
output (TEXT)

score (FLOAT)

latency_ms (INT)

metadata (JSONB)   -- tokens, errors etc

created_at (TIMESTAMP)

🧠 This table powers EVERYTHING
evaluation
comparison
observability


🔗 RELATIONSHIPS (IMPORTANT)
prompts
   └── prompt_versions
           └── experiments
                   └── runs
                           └── dataset_items
                                   └── datasets

🧠 VISUAL FLOW
Prompt → Version → Experiment → Runs → Scores
                ↘ Dataset → Items