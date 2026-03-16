# User Interface (UI) Design and Implementation – FlowState

## I. Choice of User Interface

The FlowState system uses a **Menu-Based Graphical User Interface combined with Direct Manipulation interactions**, implemented as a **web-based frontend using React.js**.

### 1. Menu-Based Interface

A menu-based interface allows users to navigate the system through clearly defined options instead of remembering commands. This improves usability and accessibility for users with different technical backgrounds.

In FlowState, the menu-based navigation is implemented using a **navigation bar (Navbar)** that provides access to the system’s main functionalities.

Example menu options:

- Home  
- Login  
- Signup  
- Dashboard  
- Submit Feature Request  
- Logout  

This structure enables users to easily navigate between different sections of the application.

---

### 2. Direct Manipulation Interface

Direct manipulation allows users to interact directly with visual elements such as buttons, forms, and links.

In FlowState, users perform actions through:

- Form inputs
- Buttons
- Navigation links
- Interactive UI elements

Examples of direct manipulation interactions include:

- Clicking **Login** to authenticate
- Clicking **Submit Feature Request**
- Filling forms to create requests
- Clicking **Logout**

These interactions make the interface intuitive and responsive.

---

### 3. Role-Based UI Design

FlowState supports multiple user roles:

- Client
- Employee
- Admin

Each role interacts with the system differently. The UI dynamically adapts to show only the relevant features for the logged-in user.

Example role-based UI behavior:

#### Client
- Dashboard
- Submit Feature Request
- View Request History

#### Employee
- Dashboard
- Assigned Tasks
- Task Updates

#### Admin
- Dashboard
- User Management
- System Monitoring

This approach improves system security and usability by restricting access to only the necessary features.

---

### 4. Web-Based Accessibility

Since FlowState is a web application, it can be accessed through a standard web browser on multiple devices such as:

- Desktop computers
- Laptops
- Mobile devices

This ensures **platform independence, scalability, and ease of deployment**.

---

# II. Implementation of UI Components

The UI for FlowState has been implemented using **React.js**, which enables modular and reusable UI components. The application is composed of several pages and components that handle user interaction with the system.

---

## 1. Home Page

Component: `Home.jsx`

### Purpose

The Home page serves as the landing page of the application and provides basic information about the FlowState system along with navigation options for authentication.

### User Interaction Flow

```
User visits Home Page
        ↓
User selects Login or Signup
        ↓
User redirected to authentication page
```

---

## 2. Signup Page

Component: `Signup.jsx`

### Purpose

The Signup page allows new users to create an account in the system.

### User Interaction Flow

```
User enters Email
User enters Password
User selects Role (Client / Employee / Admin)
User clicks Signup
        ↓
Signup request sent to backend API
        ↓
User account stored in database
```

---

## 3. Login Page

Component: `Login.jsx`

### Purpose

The Login page authenticates existing users and allows them to access the system dashboard.

### User Interaction Flow

```
User enters Email
User enters Password
User clicks Login
        ↓
Authentication request sent to backend
        ↓
Backend verifies credentials
        ↓
JWT token generated
        ↓
User redirected to Dashboard
```

---

## 4. Dashboard Page

Component: `Dashboard.jsx`

### Purpose

The dashboard acts as the central hub for users after authentication and displays role-specific functionalities.

### User Interaction Flow

```
User logs in
        ↓
Dashboard loads
        ↓
Role-based interface is displayed
```

Examples of dashboard views include:

#### Client Dashboard
- Submit Feature Request
- View Request History

#### Employee Dashboard
- View Assigned Tasks
- Update Task Status

#### Admin Dashboard
- Manage Users
- Monitor system activity

---

## 5. Feature Request Page

Component: `FeatureRequest.jsx`

### Purpose

This page allows clients to submit feature requests that can later be processed by managers and converted into development tasks.

### User Interaction Flow

```
Client opens Feature Request page
        ↓
Client enters Feature Title
Client enters Feature Description
Client clicks Submit
        ↓
Request sent to backend API
        ↓
Feature request stored in database
```

---

## 6. Navigation Bar

Component: `Navbar.jsx`

### Purpose

The navigation bar provides a **menu-based navigation system** across the application and dynamically adjusts depending on the user's authentication status.

### Example Navigation Options

- Home
- Login
- Signup
- Dashboard
- Submit Feature Request
- Logout

### Interaction Flow

```
User clicks navigation link
        ↓
Application loads the selected page
```

---

# UI Components Implemented

The following UI components have been implemented in the FlowState frontend:

| Component | Purpose |
|--------|--------|
| Home | Landing page for the platform |
| Signup | User registration |
| Login | User authentication |
| Dashboard | Role-based system overview |
| Feature Request | Submission of feature requests |
| Navbar | System navigation |

---

# Example Interaction Workflows

## Feature Request Submission Workflow

```
Client
   ↓
Login
   ↓
Dashboard
   ↓
Submit Feature Request
   ↓
Backend API
   ↓
Database stores request
```

---

## Authentication Workflow

```
User
   ↓
Login Page
   ↓
Enter credentials
   ↓
Backend verification
   ↓
JWT token issued
   ↓
User redirected to dashboard
```

---

# Summary

The FlowState user interface is implemented using a **menu-based and direct manipulation graphical interface** that provides an intuitive and user-friendly experience. The interface is built using **React.js**, enabling modular component design and efficient user interaction with backend services.

The implemented UI components support core functionalities such as user authentication, dashboard access, and feature request submission, allowing users to interact effectively with the FlowState workflow management system.
