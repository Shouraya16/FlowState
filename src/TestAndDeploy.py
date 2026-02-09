class TestResult:
    def _init_(self, task_id, passed, report):
        self.task_id = task_id
        self.passed = passed
        self.report = report
    def is_successful(self):
        return self.passed
