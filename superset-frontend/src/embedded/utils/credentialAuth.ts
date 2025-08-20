/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Utility functions for credential-based authentication in embedded Superset dashboards.
 * This allows parent applications to authenticate users programmatically.
 */

export interface SupersetCredentials {
  username: string;
  password: string;
}

export interface SupersetConfig {
  baseUrl: string;
  credentials: SupersetCredentials;
  dashboardId?: string;
  dashboardUuid?: string;
}

/**
 * Creates an iframe with embedded Superset dashboard and authenticates using credentials.
 * 
 * @param config - Configuration object containing base URL, credentials, and dashboard info
 * @param containerElement - DOM element to append the iframe to
 * @param options - Additional options for iframe creation
 * @returns Promise that resolves when authentication is complete
 */
export async function createAuthenticatedSupersetIframe(
  config: SupersetConfig,
  containerElement: HTMLElement,
  options: {
    width?: string;
    height?: string;
    style?: Partial<CSSStyleDeclaration>;
  } = {}
): Promise<HTMLIFrameElement> {
  const { baseUrl, credentials, dashboardId, dashboardUuid } = config;
  const { width = '100%', height = '100%', style = {} } = options;

  // Create the iframe
  const iframe = document.createElement('iframe');
  
  // Set the source URL - use dashboardId or dashboardUuid
  if (dashboardUuid) {
    iframe.src = `${baseUrl}/embedded/${dashboardUuid}/`;
  } else if (dashboardId) {
    iframe.src = `${baseUrl}/dashboard/${dashboardId}/embedded/`;
  } else {
    throw new Error('Either dashboardId or dashboardUuid must be provided');
  }

  // Apply default styles
  iframe.style.width = width;
  iframe.style.height = height;
  iframe.style.border = 'none';
  
  // Apply custom styles
  Object.assign(iframe.style, style);

  // Append to container
  containerElement.appendChild(iframe);

  // Wait for iframe to load, then send credentials
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Iframe load timeout'));
    }, 30000); // 30 second timeout

    iframe.onload = () => {
      clearTimeout(timeout);
      
      try {
        // Send credentials via postMessage
        iframe.contentWindow?.postMessage({
          type: '__embedded_comms__',
          credentials: credentials,
        }, baseUrl);
        
        resolve(iframe);
      } catch (error) {
        reject(error);
      }
    };

    iframe.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load iframe'));
    };
  });
}

/**
 * Alternative method using Switchboard for more advanced communication.
 * This method provides better error handling and communication capabilities.
 * 
 * @param config - Configuration object containing base URL, credentials, and dashboard info
 * @param containerElement - DOM element to append the iframe to
 * @param options - Additional options for iframe creation
 * @returns Promise that resolves when authentication is complete
 */
export async function createAuthenticatedSupersetIframeWithSwitchboard(
  config: SupersetConfig,
  containerElement: HTMLElement,
  options: {
    width?: string;
    height?: string;
    style?: Partial<CSSStyleDeclaration>;
  } = {}
): Promise<{ iframe: HTMLIFrameElement; port: MessagePort }> {
  const { baseUrl, credentials, dashboardId, dashboardUuid } = config;
  const { width = '100%', height = '100%', style = {} } = options;

  // Create the iframe
  const iframe = document.createElement('iframe');
  
  // Set the source URL
  if (dashboardUuid) {
    iframe.src = `${baseUrl}/embedded/${dashboardUuid}/`;
  } else if (dashboardId) {
    iframe.src = `${baseUrl}/dashboard/${dashboardId}/embedded/`;
  } else {
    throw new Error('Either dashboardId or dashboardUuid must be provided');
  }

  // Apply styles
  iframe.style.width = width;
  iframe.style.height = height;
  iframe.style.border = 'none';
  Object.assign(iframe.style, style);

  // Append to container
  containerElement.appendChild(iframe);

  // Create a MessageChannel for communication
  const channel = new MessageChannel();
  const { port1, port2 } = channel;

  // Wait for iframe to load, then establish communication
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Iframe load timeout'));
    }, 30000);

    iframe.onload = () => {
      clearTimeout(timeout);
      
      try {
        // Send handshake with port transfer
        iframe.contentWindow?.postMessage({
          type: '__embedded_comms__',
          handshake: 'port transfer',
        }, baseUrl, [port1]);

        // Wait for port to be ready, then authenticate
        port2.onmessage = (event) => {
          if (event.data === 'ready') {
            // Send credentials via Switchboard
            port2.postMessage({
              method: 'authenticateWithCredentials',
              params: credentials,
            });
            
            resolve({ iframe, port: port2 });
          }
        };

        // Send ready signal
        port2.postMessage('ready');
        
      } catch (error) {
        reject(error);
      }
    };

    iframe.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load iframe'));
    };
  });
}

/**
 * Helper function to extract credentials from URL parameters.
 * Note: This is less secure and should only be used in development/testing.
 * 
 * @param url - URL to extract credentials from
 * @returns Credentials object or null if not found
 */
export function extractCredentialsFromUrl(url: string): SupersetCredentials | null {
  try {
    const urlObj = new URL(url);
    const username = urlObj.searchParams.get('username');
    const password = urlObj.searchParams.get('password');
    
    if (username && password) {
      return { username, password };
    }
  } catch (error) {
    console.warn('Failed to extract credentials from URL:', error);
  }
  
  return null;
}

/**
 * Example usage function showing how to integrate with the embedded component.
 * 
 * @param config - Your Superset configuration
 * @param containerId - ID of the container element
 */
export function exampleUsage(config: SupersetConfig, containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with id '${containerId}' not found`);
    return;
  }

  // Method 1: Simple credential authentication
  createAuthenticatedSupersetIframe(config, container)
    .then(() => {
      console.log('Superset iframe created and authenticated successfully');
    })
    .catch((error) => {
      console.error('Failed to create authenticated Superset iframe:', error);
    });

  // Method 2: Advanced Switchboard communication
  // createAuthenticatedSupersetIframeWithSwitchboard(config, container)
  //   .then(({ iframe, port }) => {
  //     console.log('Superset iframe created with Switchboard communication');
  //     
  //     // You can now communicate with the iframe via the port
  //     port.postMessage({
  //       method: 'getDataMask',
  //       params: {},
  //     });
  //   })
  //   .catch((error) => {
  //     console.error('Failed to create authenticated Superset iframe:', error);
  //   });
}
