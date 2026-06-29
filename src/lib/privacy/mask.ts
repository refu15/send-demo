export function maskName(name: string, index = 0): string {
  return name ? `利用者${String.fromCharCode(65 + (index % 26))}` : "";
}

export function maskPhone(phone?: string): string {
  if (!phone) {
    return "";
  }
  return phone.replace(/(\d{2,3})-\d{3,4}-(\d{4})/, "$1-****-$2");
}

export function maskAddress(address?: string): string {
  if (!address) {
    return "";
  }
  const cityMatch = address.match(/^(.+?[市区町村])/);
  return cityMatch ? `${cityMatch[1]}まで` : "住所マスク済み";
}
