# Digital Product Passport (DPP) Management System

## Overview

This application is a **Digital Product Passport (DPP) Management System** built on the **Solid** decentralized web platform. It enables users to securely store, manage, and collaborate on digital product passports using their own Solid Pods for data storage, ensuring complete data ownership and privacy.

## Core Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Routing**: React Router v6
- **Authentication**: Solid OIDC (@inrupt/solid-client-authn-browser)
- **Data Storage**: Solid Pods (@inrupt/solid-client)
- **UI Components**: Radix UI + Custom shadcn/ui components
- **State Management**: React Query (@tanstack/react-query)
- **Build Tool**: Vite

## Key Features

### 1. Solid-Based Authentication
- **Decentralized Login**: Users authenticate using their Solid Pod identity
- **Supported Providers**: SolidCommunity.net, SolidWeb.org, and other compatible providers
- **Session Management**: Persistent login with automatic session restoration
- **No Central User Database**: Authentication is handled entirely through Solid infrastructure

### 2. Digital Product Passport Management
- **File Upload**: Upload DPP files (preferably in Turtle/RDF format) to personal Pods
- **File Storage**: Files stored in user's Pod under `/dpp/` directory
- **File Listing**: View all uploaded DPP files with metadata
- **Content Viewing**: Read and display DPP file contents
- **File Deletion**: Remove unwanted DPP files from Pod storage

### 3. Data Spaces (Collaborative Environment)
- **Collaborative Workspaces**: Create shared spaces for team collaboration
- **Role-Based Access Control**:
  - **Admin**: Full management rights (create, edit, delete, manage members)
  - **Write**: Can add and modify content
  - **Read**: View-only access
- **Access Modes**:
  - **Public**: Accessible to anyone
  - **Private**: Restricted to invited members only
  - **Restricted**: Limited access with specific permissions
- **Member Management**: Add/remove members and change their roles
- **Data Space Lifecycle**: Create, update, deactivate data spaces

### 4. Admin Panel
- **Administrative Interface**: Dedicated panel for DPP management
- **User Session Info**: Display current user's Solid identity
- **Management Tools**: Administrative functions for DPP oversight

## Application Architecture

### Main Routes
- **`/`** - Home dashboard with DPP overview and quick actions
- **`/dataspaces`** - Data spaces management interface
- **`/admin`** - Administrative panel
- **`/404`** - Not found page for invalid routes

### Core Services

#### SolidAuthService
- Handles Solid Pod authentication
- Manages user sessions and WebID
- Provides authenticated fetch for API calls
- Supports multiple Solid providers

#### SolidStorageService
- Manages DPP file operations in user's Pod
- Handles file upload, listing, and deletion
- Ensures proper folder structure (`/dpp/`)
- Provides file content retrieval

#### DataSpaceService
- Creates and manages collaborative data spaces
- Implements role-based access control
- Handles member management (add, remove, update roles)
- Stores data space metadata using custom vocabulary
- Supports data space lifecycle management

### Data Models

#### DPP File Structure
```typescript
interface DPPFile {
  url: string;           // Pod storage URL
  name: string;          // File name
  uploadedAt: Date;      // Upload timestamp
  size?: number;         // File size
  contentType?: string;  // MIME type (typically text/turtle)
}
```

#### Data Space Structure
```typescript
interface DataSpace {
  id: string;                    // Unique identifier
  title: string;                 // Display name
  description: string;           // Purpose description
  purpose: string;               // Intended use
  accessMode: AccessMode;        // public | private | restricted
  storageLocation: string;       // Pod storage path
  createdAt: Date;              // Creation timestamp
  isActive: boolean;            // Active/inactive status
  members: DataSpaceMember[];   // Collaborators
  creatorWebId: string;         // Creator's Solid WebID
}
```

#### Member Roles
- **admin**: Full control over data space and members
- **write**: Can contribute and modify content
- **read**: View-only access to data space content

## User Experience Flow

### 1. Initial Access
1. User visits the application
2. System initializes Solid session (handles redirects if returning from login)
3. If not authenticated, user sees Solid login interface
4. User selects their Solid provider and authenticates
5. Upon successful login, user accesses the main dashboard

### 2. Dashboard Overview
- **Overview Tab**: Statistics and quick actions
- **Dataspaces Tab**: Access to collaborative workspaces
- **Upload Tab**: Interface for adding new DPP files
- **Files Tab**: List of all uploaded DPP files with management options

### 3. DPP Management Workflow
1. **Upload**: User selects DPP file and uploads to their Pod
2. **Organize**: Files are automatically stored in `/dpp/` directory
3. **View**: User can browse and read file contents
4. **Manage**: Edit, download, or delete files as needed

### 4. Data Spaces Collaboration
1. **Create**: User creates new data space with specific purpose
2. **Configure**: Set access mode and initial description
3. **Invite**: Add collaborators with appropriate roles
4. **Collaborate**: Team members can access and contribute based on their roles
5. **Manage**: Admin can modify settings and member permissions

## Data Storage & Privacy

### Decentralized Architecture
- **No Central Database**: All user data stored in individual Solid Pods
- **User Ownership**: Users maintain complete control over their data
- **Interoperability**: Data can be accessed by other Solid-compatible applications
- **Privacy by Design**: No tracking or central data collection

### Data Storage Locations
- **DPP Files**: `{userPod}/dpp/` directory
- **Data Spaces**: `{userPod}/dataspaces/` directory
- **Metadata**: Stored using RDF triples with custom vocabulary

### Security Features
- **OAuth2/OIDC**: Industry-standard authentication protocols
- **Encrypted Transport**: All communications over HTTPS
- **Granular Permissions**: Fine-grained access control for shared resources
- **Audit Trail**: Activity logging within Solid infrastructure

## Technical Implementation Details

### Custom Vocabularies
The application uses custom RDF vocabularies for data spaces:
- `https://w3id.org/dataspace/vocab#DataSpace` - Data space entity type
- `https://w3id.org/dataspace/vocab#Member` - Member entity type
- Custom properties for roles, access modes, and metadata

### State Management
- **React Query**: Caching and synchronization for Pod data
- **Local State**: Component-level state for UI interactions
- **Session State**: Maintained through Solid client libraries

### Error Handling
- **Graceful Degradation**: App functions without network connectivity for cached data
- **User Feedback**: Toast notifications for operations and errors
- **Fallback UI**: Loading states and error boundaries for robustness

## Development & Deployment

### Setup Requirements
- Node.js 18+
- Modern web browser with Solid client support
- Valid Solid Pod for testing

### Key Dependencies
- `@inrupt/solid-client` - Core Solid data operations
- `@inrupt/solid-client-authn-browser` - Authentication
- `@inrupt/vocab-common-rdf` - Standard RDF vocabularies
- `@radix-ui/*` - Accessible UI primitives
- `@tanstack/react-query` - Data fetching and caching

### Build & Deployment
- Built with Vite for optimal performance
- Deployable to any static hosting service
- No server-side requirements (pure client-side application)

## Future Extensibility

The application is designed to be extensible:
- **Plugin Architecture**: Easy addition of new DPP file formats
- **Custom Vocabularies**: Support for domain-specific data schemas
- **Integration APIs**: Potential for connecting with external systems
- **Multi-Pod Support**: Framework for accessing multiple user Pods
- **Real-time Collaboration**: Foundation for live collaborative features

## Conclusion

This DPP Management System demonstrates the power of decentralized web technologies, providing users with a secure, private, and collaborative platform for managing digital product passports while maintaining complete data ownership through Solid Pods.