class TestResult:
    def _init_(self, task_id, passed, report):
        self.task_id = task_id
        self.passed = passed
        self.report = report
    def is_successful(self):
        return self.passed

class Testing:
    def execute_tests(self, task_id):
        print(f"Running test cases for Task {task_id}")

        #Simulated test execution
        passed = True
        report = "All unit and integration tests passed."

        print("Testing completed.")
        return TestResult(task_id, passed, report)
