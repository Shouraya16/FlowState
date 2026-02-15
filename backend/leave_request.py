from datetime import datetime


class LeaveRequest:
    VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"]
    
    def __init__(self, leave_id, employee_id, start_date, end_date, reason):
        self.leave_id = leave_id
        self.employee_id = employee_id
        self.start_date = start_date
        self.end_date = end_date
        self.reason = reason
        self.status = "PENDING"
        self.approved_by = None
        self.created_at = datetime.now()

    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("End date cannot be before start date.")
        return True

    def approve(self, manager_id):
        if self.status != "PENDING":
            raise Exception("Only pending requests can be approved.")
        self.status = "APPROVED"
        self.approved_by = manager_id
        print(f"Leave request {self.leave_id} approved by Manager {manager_id}")

    def reject(self, manager_id):
        if self.status != "PENDING":
            raise Exception("Only pending requests can be rejected.")
        self.status = "REJECTED"
        self.approved_by = manager_id
        print(f"Leave request {self.leave_id} rejected by Manager {manager_id}")

    def is_active_on(self, check_date):
        if self.status != "APPROVED":
            return False
        return self.start_date <= check_date <= self.end_date

    def get_leave_details(self):
        return {
            "Leave ID": self.leave_id,
            "Employee ID": self.employee_id,
            "Start Date": self.start_date,
            "End Date": self.end_date,
            "Reason": self.reason,
            "Status": self.status,
            "Approved By": self.approved_by,
            "Created At": self.created_at
        }
