from data_management import DatabaseContext

class WorkflowEngine:
    def _init_(self):
        # Initialize connection to the Data Component
        self.db = DatabaseContext()

    def process_manager_approval(self, req_id, manager_id):
        print(f"\n[Orchestration] Manager {manager_id} initiated approval for Request {req_id}")
        
        # Step 1: Fetch data using Data Management component
        request = self.db.get_feature_request(req_id)
        
        if request["status"] != "PENDING":
            raise Exception("Only pending requests can be approved.")

        # Step 2: Apply Business Logic (Update status, create Task)
        self.db.update_request_status(req_id, "APPROVED")
        
        # Step 3: Convert to Task and save using Data Management component
        print("[Orchestration] Request approved. Converting to development task...")
        task_id = self.db.insert_new_task(
            title=f"Implement: {request['title']}",
            priority="HIGH",
            status="TODO"
        )
        
        print(f"[Orchestration] Workflow complete. Task {task_id} is ready for assignment.")
        return task_id

# --- Execution Example (What happens when the API is called) ---
if __name__ == "_main_":
    engine = WorkflowEngine()
    # Simulate API triggering the engine
    created_task = engine.process_manager_approval(req_id=42, manager_id=7)
