import React from 'react'

export default function AdminDashboardContent({children}) {
  return (
    <main className="p-4 overflow-y-auto flex-1 scrollable-container">
      {children}
    </main>
  );
}
