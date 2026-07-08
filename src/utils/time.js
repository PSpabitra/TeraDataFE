export const formatLocalTime = (timestampStr) => {
  if (!timestampStr) return '';
  try {
    let dateStr = timestampStr;
    // If it's a plain ISO string from Python without 'Z' or offset, append 'Z' to treat it as UTC
    if (!dateStr.endsWith('Z') && !dateStr.includes('+') && dateStr.includes('T')) {
      dateStr += 'Z';
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return timestampStr.slice(11, 19);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch (e) {
    return timestampStr.slice(11, 19);
  }
};
