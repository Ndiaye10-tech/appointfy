export const formatFCFA = (amount) => {
  if (amount === undefined || amount === null) return '0 FCFA';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) || 0 : amount;
  return new Intl.NumberFormat('fr-FR').format(num) + ' FCFA';
};
