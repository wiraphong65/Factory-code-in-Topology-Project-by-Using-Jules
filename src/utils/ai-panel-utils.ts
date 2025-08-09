export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const getDeviceTypeLabel = (type: string) => {
  const labels: { [key: string]: string } = {
    'pc': 'PC',
    'server': 'Server',
    'firewall': 'Firewall',
    'router': 'Router',
    'switch': 'Switch',
    'unknown': 'ไม่ระบุ'
  };
  return labels[type] || type;
};

export const getDeviceTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    'pc': 'bg-blue-500',
    'server': 'bg-green-500',
    'firewall': 'bg-red-500',
    'router': 'bg-purple-500',
    'switch': 'bg-yellow-500',
    'unknown': 'bg-gray-500'
  };
  return colors[type] || 'bg-gray-500';
};

export const formatLastUpdate = (lastAnalysisAt?: string) => {
  if (!lastAnalysisAt) return '';

  const lastUpdate = new Date(lastAnalysisAt);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'เมื่อสักครู่';
  if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} วันที่แล้ว`;

  return lastUpdate.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};