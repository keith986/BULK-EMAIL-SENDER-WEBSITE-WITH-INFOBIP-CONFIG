"use client";
import Protected from '../_components/Protected';
import { useEffect, useState } from 'react';
import { fetchRecipientsFromFirebase } from '../_utils/firebase-operations';
import { useUser } from '../_context/UserProvider';

interface Recipient { name?: string; email: string }

export default function Recipients() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useUser();

  useEffect(() => {
    fetchRecipientsFromFirebase({ userId: user?.uid as string })
    .then(data => {
      setRecipients(data?.data?.rawText ? data.data.recipients : []);
      setIsLoading(true);
    })
    .catch(err => console.error('Error fetching recipients:', err instanceof Error ? err.message : String(err)));
  }, []);

const rowPerPage = 10
const lastIndex = rowPerPage * currentPage
const firstIndex = lastIndex - rowPerPage
const records = recipients.slice(firstIndex, lastIndex);
const nPage = Math.ceil(recipients.length / rowPerPage)
const numbers = [...Array(nPage + 1).keys()].slice(1)

const handlePrev = async () => {
  if(currentPage !== 1){
    return setCurrentPage(currentPage - 1)
  }else{
    return setCurrentPage(1)
  }
}

const handleNext = async () => {
  if(currentPage !== nPage){
     setCurrentPage(currentPage + 1)
  }else{
     setCurrentPage(nPage)
  }
}

function handlePage (id: number) {
  setCurrentPage(id)
}

    return (
      <Protected>
      <div className="sm:mt-21 bg-gradient-to-br from-red-200 to-slate-500 min-h-screen p-4">  
<div className="relative overflow-x-auto mt-10 sm:ml-80 sm:mr-70">
    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" className="px-6 py-3">
                    NO.
                </th>
                <th scope="col" className="px-6 py-3">
                    Email Address
                </th>
                <th scope="col" className="px-6 py-3">
                    Action
                </th>
            </tr>
        </thead>
        <tbody>
            {
            isLoading ? 
            records.map((recipient: Recipient, index: number) => {
                return (
                     <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                <td className="px-6 py-4">
                    {index + 1}
                </td>
                <td className="px-6 py-4">
                    {recipient.email}
                </td>
                <td className="px-6 py-4">
                    <button className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                </td>
            </tr>
                );
            })
            :
            <tr>
                <td colSpan={3} className="text-center px-6 py-4 text-gray-100 text-2xl">Loading...</td>
            </tr>
            }
        </tbody>
    </table>

     <div className='mt-4'>
      <nav>
        <ul className='flex flex-row justify-center items-center gap-2'>
         
          <li className='page-item'>
            <button className='bg-gray-100 px-2 rounded-xl hover:shadow-xl transform hover:scale-95 cursor-pointer' onClick={handlePrev}>Prev</button>
          </li>

          {!!numbers && numbers.map((n: number, i: number) => {
            return (
              <li className={`page-item ${currentPage === n ? 'active' : ''}`} key={i}>
                  <button className='bg-red-100 px-2 rounded-xl hover:shadow-xl transform hover:scale-95 cursor-pointer' onClick={() => handlePage(n)}>{n}</button>
                </li>
                   );
          })}

          <li className='page-item'>
            <button className='bg-gray-100 px-2 rounded-xl hover:shadow-xl transform hover:scale-95 cursor-pointer' onClick={handleNext}>Next</button>
          </li>

        </ul>
      </nav> 
      </div>

</div>

        </div>
        </Protected>
    );
}