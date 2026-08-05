import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export default function FloatingActionButton({ onClick }) {
  return (
    <motion.button 
      className="fab-button"
      onClick={onClick}
      whileHover={{ scale: 1.1, rotate: 90 }}
      whileTap={{ scale: 0.9 }}
      title="Create New Task (Ctrl + K)"
    >
      <Plus size={26} strokeWidth={2.5} />
    </motion.button>
  );
}
