import { useState, useEffect } from 'react';

interface EuropeanDateInputProps {
  value: string; // ISO format YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const EuropeanDateInput: React.FC<EuropeanDateInputProps> = ({ 
  value, 
  onChange, 
  placeholder = 'dd-mm-yyyy',
  className = '',
  style = {}
}) => {
  const [displayValue, setDisplayValue] = useState('');
  
  // Convert ISO date (YYYY-MM-DD) to display format (DD-MM-YYYY)
  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-');
      setDisplayValue(`${day}-${month}-${year}`);
    } else {
      setDisplayValue('');
    }
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Remove any non-digit characters except hyphens
    let cleaned = input.replace(/[^\d-]/g, '');
    
    // Auto-format as user types
    if (cleaned.length <= 2) {
      setDisplayValue(cleaned);
    } else if (cleaned.length <= 5) {
      const day = cleaned.slice(0, 2);
      const month = cleaned.slice(2).replace('-', '');
      setDisplayValue(`${day}-${month}`);
    } else {
      const day = cleaned.slice(0, 2);
      const month = cleaned.slice(2, 4).replace('-', '');
      const year = cleaned.slice(4, 8).replace(/-/g, '');
      setDisplayValue(`${day}-${month}-${year}`);
    }
    
    // If we have a complete date, convert to ISO and call onChange
    if (cleaned.replace(/-/g, '').length === 8) {
      const parts = cleaned.split('-');
      let day, month, year;
      
      if (parts.length === 3) {
        [day, month, year] = parts;
      } else {
        const digits = cleaned.replace(/-/g, '');
        day = digits.slice(0, 2);
        month = digits.slice(2, 4);
        year = digits.slice(4, 8);
      }
      
      // Validate and convert to ISO format
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        onChange(isoDate);
      }
    } else if (!input) {
      onChange('');
    }
  };
  
  const handleBlur = () => {
    // If incomplete, clear the field
    if (displayValue && displayValue.replace(/-/g, '').length !== 8) {
      setDisplayValue('');
      onChange('');
    }
  };
  
  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      style={style}
      maxLength={10}
    />
  );
};
