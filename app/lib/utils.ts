export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime(); // negative if past
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Hari ini";
  } else if (diffInDays === -1) {
    return "Kemarin";
  } else if (diffInDays === 1) {
    return "Besok";
  } else if (diffInDays < -1) {
    return `${Math.abs(diffInDays)} hari lalu`;
  } else {
    return `Dalam ${diffInDays} hari`;
  }
};
