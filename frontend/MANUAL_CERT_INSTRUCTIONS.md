# Manual Certificate Generation Instructions
# Since automatic generation failed, please follow these steps:

1. Open PowerShell as Administrator
2. Run the following commands:

# Create certificates directory
New-Item -ItemType Directory -Path ".\.certs" -Force

# Generate self-signed certificate
$cert = New-SelfSignedCertificate -DnsName "app.localhost", "whappstream.localhost", "test-tenant.localhost", "localhost" -CertStoreLocation "cert:\LocalMachine\My"

# Export certificate
Export-Certificate -Cert $cert -FilePath ".\.certs\cert.pem"

# Export private key (this requires additional setup)
# For now, you can use the certificate in certlm.msc

3. Trust the certificate:
- Press Win + R, type "certlm.msc", press Enter
- Navigate to Trusted Root Certification Authorities > Certificates
- Right-click > All Tasks > Import
- Select the cert.pem file from .\.certs directory

# Alternative: Use a simple HTTP setup for now
# Comment out the HTTPS configuration in vite.config.ts and use HTTP instead
