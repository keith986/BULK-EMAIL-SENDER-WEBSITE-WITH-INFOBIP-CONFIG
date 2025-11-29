"use client";
import { usePathname } from 'next/navigation';

export default function Sidebar() {
   const pathname = usePathname();

   // Don't render the sidebar on the public landing page or auth routes
   if (pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/about') || pathname.startsWith('/pricing') || pathname.startsWith('/services') || pathname.startsWith('/contact')) return null;

   return (
      <div>
       <button data-drawer-target="cta-button-sidebar" data-drawer-toggle="cta-button-sidebar" aria-controls="cta-button-sidebar" type="button" className="inline-flex items-center p-2 mt-2 ms-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 z-100">
   <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
   <path clipRule="evenodd" fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
   </svg>
</button>

<aside id="cta-button-sidebar" className="fixed top-21 pb-20 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
   <div className="h-full px-3 py-4 overflow-y-auto bg-gradient-to-l from-red-100 to-slate-300">
      <ul className="space-y-2 font-medium">
         <li>
            <a href="/dashboard" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-900 dark:hover:text-gray-100 group">
               <svg className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 21">
                  <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z"/>
                  <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z"/>
               </svg>
               <span className="ms-3">Dashboard</span>
            </a>
         </li>
         <li>
            <a href="/compose&send" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-100 group">
               <svg className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
               <path d="M2.038 5.61A2.01 2.01 0 0 0 2 6v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6c0-.12-.01-.238-.03-.352l-.866.65-7.89 6.032a2 2 0 0 1-2.429 0L2.884 6.288l-.846-.677Z"/>
               <path d="M20.677 4.117A1.996 1.996 0 0 0 20 4H4c-.225 0-.44.037-.642.105l.758.607L12 10.742 19.9 4.7l.777-.583Z"/>
               </svg>
               <span className="flex-1 ms-3 whitespace-nowrap">Compose Email</span>
            </a>
         </li>
         <li>
            <a href="/add-recipients" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-100 group">
                <svg className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M9 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4H7Zm8-1a1 1 0 0 1 1-1h1v-1a1 1 0 1 1 2 0v1h1a1 1 0 1 1 0 2h-1v1a1 1 0 1 1-2 0v-1h-1a1 1 0 0 1-1-1Z" clipRule="evenodd"/>
                </svg>
               <span className="flex-1 ms-3 whitespace-nowrap">Add Recipients</span>
            </a>
         </li>
         <li>
            <a href="/recipients" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-100 group">
               <svg className="shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z"/>
               </svg>
               <span className="flex-1 ms-3 whitespace-nowrap">Recipients</span>
            </a>
         </li>
         <li>
            <a href="/batch-settings" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-100 group">
               <svg className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
               <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v5a1 1 0 1 0 2 0V8Zm-1 7a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2H12Z" clipRule="evenodd"/>
               </svg>
               <span className="flex-1 ms-3 whitespace-nowrap">Batch Settings</span>
            </a>
         </li>
         <li>
            <a href="/api-config" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-100 group">
                <svg className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2a1 1 0 0 1 .932.638l7 18a1 1 0 0 1-1.326 1.281L13 19.517V13a1 1 0 1 0-2 0v6.517l-5.606 2.402a1 1 0 0 1-1.326-1.281l7-18A1 1 0 0 1 12 2Z" clipRule="evenodd"/>
                </svg>
               <span className="flex-1 ms-3 whitespace-nowrap">API Config</span>
            </a>
         </li>
         <li>
            <a href="/campaign&history" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-100 group">
                <svg className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.651 7.65a7.131 7.131 0 0 0-12.68 3.15M18.001 4v4h-4m-7.652 8.35a7.13 7.13 0 0 0 12.68-3.15M6 20v-4h4"/>
                </svg>
               <span className="flex-1 ms-3 whitespace-nowrap">Campaign History</span>
            </a>
         </li>
      </ul>
      <div id="dropdown-cta" className="p-4 mt-6 rounded-lg bg-blue-50 dark:bg-blue-900" role="alert">
         <div className="flex items-center mb-3">
            <span className="bg-orange-100 text-orange-800 text-sm font-semibold me-2 px-2.5 py-0.5 rounded-sm dark:bg-orange-200 dark:text-orange-900">Performance Tips</span>
         </div>
         <ul className="text-sm text-gray-600 dark:text-gray-400">
            <li className="mb-1">Tip 1: Configure batch settings and API in the sidebar before sending.</li>
            <li className="mb-1">Tip 2: Use batch size of 20-50 emails for optimal speed and reliability.</li>
            <li className="mb-1">Tip 3: Set delay between batches to 500-1000ms to avoid rate limiting.</li>
            <li className="mb-1">Tip 4: Keep browser tab open during sending process.</li>
            <li className="mb-1">Tip 5: Use CSV upload for large recipient lists.</li>
         </ul>
          <a className="text-sm text-blue-800 mt-10 font-medium hover:text-red-900 dark:text-red-400 dark:hover:text-blue-300" href="#">Estimated time for 20K emails: 15-30 minutes with proper batching.</a>
        </div>
   </div>
</aside>
   </div>
   );
}