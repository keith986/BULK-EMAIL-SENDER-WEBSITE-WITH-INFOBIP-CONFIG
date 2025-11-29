"use client";
import Protected from '../_components/Protected';
import { useEffect, useState } from 'react';
import { fetchRecipientsFromFirebase, removeRecipientFromFirebase, removeRecipientsFromFirebase } from '../_utils/firebase-operations';
import { toast, ToastContainer } from 'react-toastify';
import { useUser } from '../_context/UserProvider';

interface Recipient { name?: string; email: string }

export default function Recipients() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [pendingBulkAction, setPendingBulkAction] = useState<'selected' | 'all' | null>(null);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [pendingDeleteEmail, setPendingDeleteEmail] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useUser();

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    setIsLoading(true);
    fetchRecipientsFromFirebase({ userId: uid })
    .then(data => {
      setRecipients(data?.data?.recipients ?? []);
      setSelectedEmails([]);
    })
    .catch(err => console.error('Error fetching recipients:', err instanceof Error ? err.message : String(err)))
    .finally(() => setIsLoading(false));
  }, [user?.uid]);

  const toggleSelectAllOnPage = () => {
    const pageEmails = records.map(r => r.email);
    const allSelected = pageEmails.every(e => selectedEmails.includes(e));
    if (allSelected) {
      setSelectedEmails(prev => prev.filter(e => !pageEmails.includes(e)));
    } else {
      setSelectedEmails(prev => Array.from(new Set([...prev, ...pageEmails])));
    }
  };

  const confirmBulkDelete = async (action: 'selected' | 'all') => {
    const uid = user?.uid;
    if (!uid) return toast.error('You must be signed in to perform this action');

    let emailsToDelete: string[] = [];
    if (action === 'selected') {
      if (selectedEmails.length === 0) return toast.info('No recipients selected');
      emailsToDelete = selectedEmails.slice();
    } else { // all
      if (recipients.length === 0) return toast.info('No recipients to delete');
      emailsToDelete = recipients.map(r => r.email);
    }

    try {
      setDeletingBulk(true);
      const resp = await removeRecipientsFromFirebase({ userId: uid, emails: emailsToDelete });
      if (resp.code === 777) {
        // update UI
        const emailsSet = new Set(emailsToDelete.map(e => e.toLowerCase()));
        setRecipients(prev => prev.filter(p => !emailsSet.has(p.email.toLowerCase())));
        setSelectedEmails([]);
        toast.success(resp.message);
      } else {
        toast.error('Delete failed: ' + resp.message);
      }
    } catch (err) {
      toast.error('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPendingBulkAction(null);
      setDeletingBulk(false);
    }
  };

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
      {/* Bulk action toolbar */}
      <div className="md:flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => toggleSelectAllOnPage()} className="px-3 py-1 bg-gray-100 rounded">Toggle select page</button>
          <button onClick={() => setPendingBulkAction('selected')} disabled={selectedEmails.length === 0 || deletingBulk} className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50">Delete selected ({selectedEmails.length})</button>
          <button onClick={() => setPendingBulkAction('all')} disabled={recipients.length === 0 || deletingBulk} className="px-3 py-1 bg-red-700 text-white rounded disabled:opacity-50">Delete all ({recipients.length})</button>
        </div>
        <div>
          <span className="text-sm text-gray-600">Showing {firstIndex + 1} - {Math.min(lastIndex, recipients.length)} of {recipients.length}</span>
        </div>
      </div>

      {/* Inline confirmation for bulk actions */}
      {pendingBulkAction && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-center justify-between">
          <div className="text-sm text-gray-700">{pendingBulkAction === 'selected' ? `Delete ${selectedEmails.length} selected recipient(s)?` : `Delete ALL ${recipients.length} recipient(s)?`}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => confirmBulkDelete(pendingBulkAction)} disabled={deletingBulk} className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50">{deletingBulk ? 'Deleting…' : 'Confirm'}</button>
            <button onClick={() => setPendingBulkAction(null)} disabled={deletingBulk} className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50">Cancel</button>
          </div>
        </div>
      )}
  <ToastContainer position="top-right" autoClose={7000} hideProgressBar={false} closeOnClick draggable pauseOnHover theme={"light"} />
    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                <input type="checkbox" aria-label="Select all on page" onChange={toggleSelectAllOnPage} checked={records.length > 0 && records.every(r => selectedEmails.includes(r.email))} />
              </th>
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
            !isLoading ? 
            records.map((recipient: Recipient, index: number) => {
                return (
                    <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedEmails.includes(recipient.email)}
                            onChange={() => {
                              setSelectedEmails(prev => prev.includes(recipient.email) ? prev.filter(e => e !== recipient.email) : [...prev, recipient.email]);
                            }}
                            aria-label={`Select ${recipient.email}`}
                            className="w-4 h-4"
                          />
                        </td>
                <td className="px-6 py-4">
                  {firstIndex + index + 1}
                </td>
                <td className="px-6 py-4">
                    {recipient.email}
                </td>
                <td className="px-6 py-4">
                    {pendingDeleteEmail === recipient.email ? (
                      <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-1 rounded">
                        <span className="text-sm text-gray-700">Delete {recipient.email}?</span>
                        <button
                          onClick={async () => {
                            if (!user?.uid) return toast.error('You must be signed in to delete recipients');
                            try {
                              setDeletingEmail(recipient.email);
                              const resp = await removeRecipientFromFirebase({ userId: user.uid, email: recipient.email });
                              if (resp.code === 777) {
                                setRecipients(prev => prev.filter(p => p.email !== recipient.email));
                                toast.success('Recipient deleted');
                              } else {
                                toast.error('Delete failed: ' + resp.message);
                              }
                            } catch (err) {
                              toast.error('Error: ' + (err instanceof Error ? err.message : String(err)));
                            } finally {
                              setDeletingEmail(null);
                              setPendingDeleteEmail(null);
                            }
                          }}
                          disabled={deletingEmail === recipient.email}
                          className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingEmail === recipient.email ? 'Deleting…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setPendingDeleteEmail(null)}
                          disabled={deletingEmail === recipient.email}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPendingDeleteEmail(recipient.email)}
                        disabled={deletingEmail === recipient.email}
                        className="font-medium text-red-600 dark:text-red-500 hover:underline disabled:opacity-50"
                      >
                        {deletingEmail === recipient.email ? 'Deleting…' : 'Delete'}
                      </button>
                    )}
                </td>
            </tr>
                );
            })
            :
            <tr>
              <td colSpan={4} className="text-center px-6 py-4 text-gray-100 text-2xl">Loading...</td>
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
                  <button className={`${currentPage === n ? 'bg-red-900 dark:bg-red-700 text-white px-2 rounded-xl hover:shadow-xl transform hover:scale-95 cursor-pointer' : 'bg-red-100 px-2 rounded-xl hover:shadow-xl transform hover:scale-95 cursor-pointer'}`} onClick={() => handlePage(n)}>{n}</button>
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