import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const FloatingActionButton = React.memo(function FloatingActionButton({ onClick }) {
  return (
    <motion.button 
      className="fab-button"
      onClick={onClick}
      whileHover={{ scale: 1.05, translateY: -2 }}
      whileTap={{ scale: 0.95 }}
      title="Create New Task"
    >
      <Plus size={26} strokeWidth={2.5} />
    </motion.button>
  );
});

export default FloatingActionButton;
