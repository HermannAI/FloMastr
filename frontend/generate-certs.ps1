# PowerShell script to generate self-signed certificates for local development
# Run this script as Administrator

param(
    [string]$CertDir = ".\.certs",
    [string[]]$Domains = @("app.localhost", "whappstream.localhost", "test-tenant.localhost", "localhost")
)

# Create certificate directory if it doesn't exist
if (!(Test-Path $CertDir)) {
    New-Item -ItemType Directory -Path $CertDir | Out-Null
}

# Generate self-signed certificate
$cert = New-SelfSignedCertificate -DnsName $Domains -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(1)

# Export certificate and private key
$certPath = Join-Path $CertDir "cert.pem"
$keyPath = Join-Path $CertDir "key.pem"

# Export certificate as PEM
$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
[System.IO.File]::WriteAllBytes($certPath, $certBytes)

# Export private key
$rsa = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
$keyBytes = $rsa.Key.Export([System.Security.Cryptography.CngKeyBlobFormat]::Pkcs8PrivateBlob)
[System.IO.File]::WriteAllBytes($keyPath, $keyBytes)

Write-Host "Certificates generated successfully:"
Write-Host "Certificate: $certPath"
Write-Host "Private Key: $keyPath"
Write-Host ""
Write-Host "Certificate thumbprint: $($cert.Thumbprint)"
Write-Host ""
Write-Host "To trust the certificate, run the following command as Administrator:"
Write-Host "certlm.msc"
Write-Host "Then import the certificate from: $certPath"
