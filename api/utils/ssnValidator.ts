export function validateAndParseSSN(ssnInput: string): number {
  // Remove all non-digit characters
  const digitsOnly = ssnInput.replace(/\D/g, '');
  
  // Validate that it's exactly 9 digits
  if (digitsOnly.length !== 9) {
    throw new Error("SSN must be exactly 9 digits");
  }
  
  // Validate that it's all numeric
  if (!/^\d{9}$/.test(digitsOnly)) {
    throw new Error("SSN must contain only digits");
  }
  
  // Convert to number
  const ssnNumber = parseInt(digitsOnly, 10);

  return ssnNumber;
}

export function formatSSN(ssnNumber: number): string {
  const ssnStr = ssnNumber.toString().padStart(9, '0');
  return `${ssnStr.slice(0, 3)}-${ssnStr.slice(3, 5)}-${ssnStr.slice(5, 9)}`;
}