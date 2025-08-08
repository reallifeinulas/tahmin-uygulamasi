import React, { ReactNode } from 'react';
import { 
  TableContainer, 
  Table, 
  useMediaQuery, 
  useTheme,
  Paper,
  Box
} from '@mui/material';

interface ResponsiveTableProps {
  children: ReactNode;
  minWidth?: number;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ 
  children, 
  minWidth = 800 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        // Mobile'da horizontal scroll ekle
        overflowX: isMobile ? 'auto' : 'visible',
        // Mobile'da table minimum genişlik
        '& .MuiTable-root': {
          minWidth: isMobile ? minWidth : 'auto',
        },
        // Mobile'da daha kompakt padding
        '& .MuiTableCell-root': {
          padding: isMobile ? '8px 4px' : '16px',
          fontSize: isMobile ? '0.75rem' : '0.875rem',
        },
        // Mobile'da sticky header
        position: 'relative',
        '& .MuiTableHead-root .MuiTableCell-root': {
          position: isMobile ? 'sticky' : 'static',
          top: 0,
          backgroundColor: theme.palette.background.paper,
          zIndex: 1,
        }
      }}
    >
      <Table>
        {children}
      </Table>
    </TableContainer>
  );
};

export default ResponsiveTable; 