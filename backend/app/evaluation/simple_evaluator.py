class SimpleEvaluator:

    @staticmethod
    def score(output: str, expected: str):
        if not expected:
            return None

        output = output.lower()
        expected = expected.lower()

        return 1.0 if expected in output else 0.0