
export function generateStudentId(date, sequence) {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // e.g. 20240501
    const paddedSeq = sequence.toString().padStart(3, '0'); // e.g. 001
    return `${dateStr}${paddedSeq}`;
  }
  