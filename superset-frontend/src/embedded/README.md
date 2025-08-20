# Embedded Superset with Credential Authentication

This module provides enhanced authentication capabilities for embedded Superset dashboards, allowing parent applications to authenticate users programmatically using username and password credentials.

## Features

- **Credential-based Authentication**: Authenticate users directly with username/password
- **PostMessage Communication**: Secure communication between parent and embedded iframe
- **Switchboard Integration**: Advanced communication using Superset's Switchboard system
- **Multiple Authentication Methods**: Support for both simple and advanced authentication flows
- **TypeScript Support**: Full type definitions for better development experience

## Quick Start

### Basic Usage

```typescript
import { createAuthenticatedSupersetIframe, SupersetConfig } from './embedded/utils';

const config: SupersetConfig = {
  baseUrl: 'https://your-superset-instance.com',
  credentials: {
    username: 'your-username',
    password: 'your-password'
  },
  dashboardId: '123' // or use dashboardUuid: 'uuid-here'
};

// Create and authenticate the iframe
createAuthenticatedSupersetIframe(config, document.getElementById('superset-container'))
  .then(() => {
    console.log('Authentication successful!');
  })
  .catch((error) => {
    console.error('Authentication failed:', error);
  });
```

### Advanced Usage with Switchboard

```typescript
import { createAuthenticatedSupersetIframeWithSwitchboard } from './embedded/utils';

createAuthenticatedSupersetIframeWithSwitchboard(config, container)
  .then(({ iframe, port }) => {
    console.log('Iframe created with Switchboard communication');
    
    // You can now communicate with the iframe
    port.postMessage({
      method: 'getDataMask',
      params: {}
    });
  });
```

## API Reference

### Interfaces

#### `SupersetCredentials`
```typescript
interface SupersetCredentials {
  username: string;
  password: string;
}
```

#### `SupersetConfig`
```typescript
interface SupersetConfig {
  baseUrl: string;
  credentials: SupersetCredentials;
  dashboardId?: string;      // Use either dashboardId
  dashboardUuid?: string;    // or dashboardUuid
}
```

### Functions

#### `createAuthenticatedSupersetIframe()`
Creates an iframe with embedded Superset dashboard and authenticates using credentials.

**Parameters:**
- `config`: Configuration object
- `containerElement`: DOM element to append the iframe to
- `options`: Optional styling and sizing options

**Returns:** Promise that resolves to the created iframe element

#### `createAuthenticatedSupersetIframeWithSwitchboard()`
Creates an iframe with advanced Switchboard communication capabilities.

**Parameters:** Same as above

**Returns:** Promise that resolves to an object containing the iframe and communication port

#### `extractCredentialsFromUrl()`
Helper function to extract credentials from URL parameters (development/testing only).

## Authentication Flow

1. **Iframe Creation**: The utility creates an iframe pointing to the embedded dashboard
2. **Credential Transmission**: Credentials are sent via postMessage to the iframe
3. **Authentication**: The embedded component receives credentials and authenticates with Superset
4. **Dashboard Loading**: After successful authentication, the dashboard loads automatically

## Security Considerations

- **Credentials in URL**: Never pass credentials as URL parameters in production
- **HTTPS**: Always use HTTPS for credential transmission
- **CSRF Protection**: The system automatically includes CSRF tokens for security
- **Session Management**: Credentials are used once for authentication, then Superset manages the session

## Error Handling

The system provides comprehensive error handling:

```typescript
createAuthenticatedSupersetIframe(config, container)
  .then(() => {
    console.log('Success!');
  })
  .catch((error) => {
    if (error.message.includes('timeout')) {
      console.error('Iframe failed to load within timeout');
    } else if (error.message.includes('authentication')) {
      console.error('Invalid credentials');
    } else {
      console.error('Unexpected error:', error);
    }
  });
```

## Integration Examples

### React Component

```tsx
import React, { useEffect, useRef } from 'react';
import { createAuthenticatedSupersetIframe } from './embedded/utils';

const SupersetDashboard: React.FC<{ config: SupersetConfig }> = ({ config }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      createAuthenticatedSupersetIframe(config, containerRef.current)
        .catch(console.error);
    }
  }, [config]);

  return <div ref={containerRef} style={{ width: '100%', height: '600px' }} />;
};
```

### Vanilla JavaScript

```javascript
// Load the utility functions
import('./embedded/utils').then(({ createAuthenticatedSupersetIframe }) => {
  const config = {
    baseUrl: 'https://superset.example.com',
    credentials: {
      username: 'user',
      password: 'pass'
    },
    dashboardId: '123'
  };

  createAuthenticatedSupersetIframe(config, document.getElementById('container'));
});
```

## Troubleshooting

### Common Issues

1. **Authentication Fails**: Check that credentials are correct and Superset is accessible
2. **Iframe Not Loading**: Verify the baseUrl and dashboard ID/UUID are correct
3. **CORS Errors**: Ensure the parent domain is allowed in Superset's CORS configuration
4. **Timeout Errors**: Check network connectivity and Superset server status

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
WEBPACK_MODE=development
```

This will provide detailed logging in the browser console for troubleshooting.

## Migration from Guest Token

If you're currently using guest tokens, you can migrate to credential authentication:

```typescript
// Old guest token approach
const iframe = document.createElement('iframe');
iframe.src = `${baseUrl}/embedded/${uuid}/?guest_token=${guestToken}`;

// New credential approach
createAuthenticatedSupersetIframe({
  baseUrl,
  credentials: { username, password },
  dashboardUuid: uuid
}, container);
```

## Support

For issues and questions:
1. Check the browser console for error messages
2. Verify Superset configuration and permissions
3. Review the authentication flow documentation
4. Check Superset server logs for backend errors
