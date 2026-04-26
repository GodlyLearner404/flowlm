class PromptBuilder:

    @staticmethod
    def build(template: str, variables: list, input_data: dict):
        try:
            return template.format(**input_data)
        except KeyError as e:
            raise ValueError(f"Missing variable: {e}")