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
