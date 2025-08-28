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
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { SupersetClient, styled, t, css, logging } from '@superset-ui/core';
import {
  Button,
  Card,
  Flex,
  Form,
  Input,
  Typography,
  Icons,
} from '@superset-ui/core/components';
import { useEffect, useState } from 'react';
import { capitalize } from 'lodash/fp';
import getBootstrapData from 'src/utils/getBootstrapData';

type OAuthProvider = {
  name: string;
  icon: string;
};

type OIDProvider = {
  name: string;
  url: string;
};

type Provider = OAuthProvider | OIDProvider;

interface LoginForm {
  username: string;
  password: string;
}

enum AuthType {
  AuthOID = 0,
  AuthDB = 1,
  AuthLDAP = 2,
  AuthOauth = 4,
}

const StyledCard = styled(Card)`
  ${({ theme }) => css`
    max-width: 400px;
    width: 100%;
    margin-top: ${theme.marginXL}px;
    color: ${theme.colorBgContainer};
    background: ${theme.colorBgBase};
    .ant-form-item-label label {
      color: ${theme.colorPrimary};
    }
  `}
`;

const StyledLabel = styled(Typography.Text)`
  ${({ theme }) => css`
    font-size: ${theme.fontSizeSM}px;
  `}
`;

export default function Login() {
  const [form] = Form.useForm<LoginForm>();
  const [loading, setLoading] = useState(false);
  const [hideUI, setHideUI] = useState(false);

  const bootstrapData = getBootstrapData();

  const authType: AuthType = bootstrapData.common.conf.AUTH_TYPE;
  const providers: Provider[] = bootstrapData.common.conf.AUTH_PROVIDERS;
  const authRegistration: boolean =
    bootstrapData.common.conf.AUTH_USER_REGISTRATION;

  const onFinish = (values: LoginForm) => {
    setHideUI(true);
    logging.debug('[Login] Submitting credentials (username only logged):', {
      username: values.username,
      passwordLength: values.password?.length || 0,
    });
    // Also log to console for non-dev builds
    // Note: We never log the raw password, only its length
    // eslint-disable-next-line no-console
    console.log('[Login] Submitting credentials (username only logged):', {
      username: values.username,
      passwordLength: values.password?.length || 0,
    });
    setLoading(true);
    SupersetClient.postForm('/login/', values, '').finally(() => {
      setLoading(false);
    });
  };

  // Prefill form from URL params or session storage (for redirects)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      logging.debug('[Login] Current URL:', window.location.href);
      logging.debug('[Login] URLSearchParams:', params.toString());
      // eslint-disable-next-line no-console
      console.log('[Login] Current URL:', window.location.href);
      // eslint-disable-next-line no-console
      console.log('[Login] URLSearchParams:', params.toString());
      // If username and password are encrypted in the URL, decode them using atob
      const urlUsername = atob(params.get('username') as string);
      const urlPassword = atob(params.get('password') as string);
      console.log('urlPassword', urlPassword);
      console.log('urlUsername', urlUsername);
      let autoLoginParam = params.get('autoLogin');

      // Also support credentials passed inside the `next` param (redirect target)
      const nextParam = params.get('next');
      if (nextParam) {
        try {
          // Parse the next URL and extract its query params
          const nextUrl = new URL(nextParam, window.location.origin);
          const nextParams = new URLSearchParams(nextUrl.search);
          const nextUsername = nextParams.get('username') || '';
          const nextPassword = nextParams.get('password') || '';
          const nextAutoLogin = nextParams.get('autoLogin');

          logging.debug('[Login] Detected credentials in next param:', {
            hasUsername: !!nextUsername,
            passwordLength: nextPassword.length,
            nextAutoLogin,
            nextRaw: nextParam,
          });
          // eslint-disable-next-line no-console
          console.log('[Login] Detected credentials in next param:', {
            hasUsername: !!nextUsername,
            passwordLength: nextPassword.length,
            nextAutoLogin,
            nextRaw: nextParam,
          });

          if (nextUsername) sessionStorage.setItem('login_prefill_username', nextUsername);
          if (nextPassword) sessionStorage.setItem('login_prefill_password', nextPassword);
          if (nextAutoLogin && !autoLoginParam) autoLoginParam = nextAutoLogin;
        } catch (err) {
          logging.error('[Login] Failed to parse next param for credentials:', err);
          // eslint-disable-next-line no-console
          console.error('[Login] Failed to parse next param for credentials:', err);
        }
      }

      // If username/password are present in the URL, store them so they survive redirects
      if (urlUsername) sessionStorage.setItem('login_prefill_username', urlUsername);
      if (urlPassword) sessionStorage.setItem('login_prefill_password', urlPassword);
      if (autoLoginParam) sessionStorage.setItem('login_auto', autoLoginParam);

      const storedUsername = sessionStorage.getItem('login_prefill_username') || '';
      const storedPassword = sessionStorage.getItem('login_prefill_password') || '';
      const autoLogin = (sessionStorage.getItem('login_auto') || '').toLowerCase() === 'true';

      const username = urlUsername || storedUsername;
      const password = urlPassword || storedPassword;

      logging.debug('[Login] Parsed credentials:', {
        username,
        passwordLength: password.length,
        autoLogin,
        source: {
          fromUrl: { hasUsername: !!urlUsername, hasPassword: !!urlPassword },
          fromStorage: { hasUsername: !!storedUsername, hasPassword: !!storedPassword },
        },
      });
      // eslint-disable-next-line no-console
      console.log('[Login] Parsed credentials:', {
        username,
        passwordLength: password.length,
        autoLogin,
        source: {
          fromUrl: { hasUsername: !!urlUsername, hasPassword: !!urlPassword },
          fromStorage: { hasUsername: !!storedUsername, hasPassword: !!storedPassword },
        },
      });

      if (username || password) {
        console.log('username', username);
        console.log('password', password);
        form.setFieldsValue({ username, password });
        setHideUI(true);
        // onFinish({ username, password });
        form.submit();
        logging.debug('[Login] Prefilled form fields with provided credentials');
        // eslint-disable-next-line no-console
        console.log('[Login] Prefilled form fields with provided credentials');
      }

      if (username && password && (autoLogin || params.get('autoLogin') === 'true')) {
        logging.debug('[Login] Auto-login conditions met. Submitting form...');
        // eslint-disable-next-line no-console
        console.log('[Login] Auto-login conditions met. Submitting form...');
        setHideUI(true);
        onFinish({ username, password });
      }
    } catch (e) {
      logging.error('[Login] Error while parsing URL/session for prefill:', e);
      // eslint-disable-next-line no-console
      console.error('[Login] Error while parsing URL/session for prefill:', e);
    }

    // Allow parent window to post credentials to this login page
    const handleMessage = (event: MessageEvent) => {
      if (!event || typeof event.data !== 'object') return;
      const { type, username, password, autoLogin } = event.data as {
        type?: string;
        username?: string;
        password?: string;
        autoLogin?: boolean;
      };
      if (type !== '__login_prefill__') return;

      logging.debug('[Login] Received __login_prefill__ message from parent', {
        hasUsername: !!username,
        passwordLength: password?.length || 0,
        autoLogin,
        origin: event.origin,
      });
      // eslint-disable-next-line no-console
      console.log('[Login] Received __login_prefill__ message from parent', {
        hasUsername: !!username,
        passwordLength: password?.length || 0,
        autoLogin,
        origin: event.origin,
      });

      const nextUsername = username || '';
      const nextPassword = password || '';
      if (nextUsername) sessionStorage.setItem('login_prefill_username', nextUsername);
      if (nextPassword) sessionStorage.setItem('login_prefill_password', nextPassword);
      if (typeof autoLogin === 'boolean') sessionStorage.setItem('login_auto', String(autoLogin));

      form.setFieldsValue({ username: nextUsername, password: nextPassword });
      logging.debug('[Login] Form fields set from postMessage');
      // eslint-disable-next-line no-console
      console.log('[Login] Form fields set from postMessage');
      if (nextUsername && nextPassword && autoLogin) {
        logging.debug('[Login] Auto-login triggered from postMessage');
        // eslint-disable-next-line no-console
        console.log('[Login] Auto-login triggered from postMessage');
        setHideUI(true);
        onFinish({ username: nextUsername, password: nextPassword });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [form]);

  const getAuthIconElement = (
    providerName: string,
  ): React.JSX.Element | undefined => {
    if (!providerName || typeof providerName !== 'string') {
      return undefined;
    }
    const iconComponentName = `${capitalize(providerName)}Outlined`;
    const IconComponent = (Icons as Record<string, React.ComponentType<any>>)[
      iconComponentName
    ];

    if (IconComponent && typeof IconComponent === 'function') {
      return <IconComponent />;
    }
    return undefined;
  };

  if (hideUI) {
    return <></>;
  }

  return (
    <Flex
      justify="center"
      align="center"
      data-test="login-form"
      css={css`
        width: 100%;
        height: calc(100vh - 200px);
      `}
    >
      <StyledCard title={t('Sign in')} padded>
        {authType === AuthType.AuthOID && (
          <Flex justify="center" vertical gap="middle">
            <Form layout="vertical" requiredMark="optional" form={form}>
              {providers.map((provider: OIDProvider) => (
                <Form.Item<LoginForm>>
                  <Button
                    href={`/login/${provider.name}`}
                    block
                    iconPosition="start"
                    icon={getAuthIconElement(provider.name)}
                  >
                    {t('Sign in with')} {capitalize(provider.name)}
                  </Button>
                </Form.Item>
              ))}
            </Form>
          </Flex>
        )}
        {authType === AuthType.AuthOauth && (
          <Flex justify="center" gap={0} vertical>
            <Form layout="vertical" requiredMark="optional" form={form}>
              {providers.map((provider: OAuthProvider) => (
                <Form.Item<LoginForm>>
                  <Button
                    href={`/login/${provider.name}`}
                    block
                    iconPosition="start"
                    icon={getAuthIconElement(provider.name)}
                  >
                    {t('Sign in with')} {capitalize(provider.name)}
                  </Button>
                </Form.Item>
              ))}
            </Form>
          </Flex>
        )}

        {(authType === AuthType.AuthDB || authType === AuthType.AuthLDAP) && (
          <Flex justify="center" vertical gap="middle">
            <Typography.Text type="secondary">
              {t('Enter your login and password below:')}
            </Typography.Text>
            <Form
              layout="vertical"
              requiredMark="optional"
              form={form}
              onFinish={onFinish}
            >
              <Form.Item<LoginForm>
                label={<StyledLabel>{t('Username:')}</StyledLabel>}
                name="username"
                rules={[
                  { required: true, message: t('Please enter your username') },
                ]}
              >
                <Input
                  autoFocus
                  prefix={<Icons.UserOutlined iconSize="l" />}
                  data-test="username-input"
                />
              </Form.Item>
              <Form.Item<LoginForm>
                label={<StyledLabel>{t('Password:')}</StyledLabel>}
                name="password"
                rules={[
                  { required: true, message: t('Please enter your password') },
                ]}
              >
                <Input.Password
                  prefix={<Icons.KeyOutlined iconSize="l" />}
                  data-test="password-input"
                />
              </Form.Item>
              <Form.Item label={null}>
                <Flex
                  css={css`
                    width: 100%;
                  `}
                >
                  <Button
                    block
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    data-test="login-button"
                  >
                    {t('Sign in')}
                  </Button>
                  {authRegistration && (
                    <Button
                      block
                      type="default"
                      href="/register/"
                      data-test="register-button"
                    >
                      {t('Register')}
                    </Button>
                  )}
                </Flex>
              </Form.Item>
            </Form>
          </Flex>
        )}
      </StyledCard>
    </Flex>
  );
}
