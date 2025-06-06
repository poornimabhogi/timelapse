// AWS SDK module declarations
declare module '@aws-sdk/client-s3' {
  export class S3Client {
    constructor(config: any);
  }
  export class PutObjectCommand {
    constructor(input: any);
  }
  export class GetObjectCommand {
    constructor(input: any);
  }
  // Add other classes as needed
}

declare module '@aws-sdk/s3-request-presigner' {
  export function getSignedUrl(client: any, command: any, options?: any): Promise<string>;
}

declare module '@aws-sdk/client-cognito-identity-provider' {
  export class CognitoIdentityProviderClient {
    constructor(config: any);
  }
  export class InitiateAuthCommand {
    constructor(input: any);
  }
  export class SignUpCommand {
    constructor(input: any);
  }
  export class ConfirmSignUpCommand {
    constructor(input: any);
  }
  export class ForgotPasswordCommand {
    constructor(input: any);
  }
  export class ConfirmForgotPasswordCommand {
    constructor(input: any);
  }
  export class GetUserCommand {
    constructor(input: any);
  }
  // Add other classes as needed
}

// Ensure other AWS SDK modules are declared if needed
declare module '@aws-sdk/credential-provider-cognito-identity' {}
declare module '@aws-sdk/client-cognito-identity' {}

// Add other module declarations as needed 