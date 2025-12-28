"use client";
import Protected from '../_components/Protected';
import { useEffect, useState } from 'react';
import { fetchRecipientsFromFirebase, removeRecipientFromFirebase, removeRecipientsFromFirebase } from '../_utils/firebase-operations';
import { toast, ToastContainer } from 'react-toastify';
import { useUser } from '../_context/UserProvider';

interface Recipient { 
  name?: string; 
  email: string;
  username?: string;
  groups?: string[];
}

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
  
  // Group management state
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [groups, setGroups] = useState<string[]>(['VIP', 'Newsletter', 'Customers', 'Leads']);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [recipientToGroup, setRecipientToGroup] = useState<Recipient | null>(null);
  const [showBulkGroupModal, setShowBulkGroupModal] = useState(false);
  const [bulkGroupAction, setBulkGroupAction] = useState<'add' | 'remove'>('add');

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    setIsLoading(true);
    
    Promise.all([
      fetchRecipientsFromFirebase({ userId: uid }),
      import('../_utils/firebase-operations').then(mod => mod.fetchGroupsFromFirebase({ userId: uid }))
    ])
    .then(([recipientsData, groupsData]) => {
      const fetchedRecipients = recipientsData?.data?.recipients ?? [];
      setRecipients(fetchedRecipients);
      setSelectedEmails([]);
      
      // Get groups from Firebase or use defaults
      const savedGroups = groupsData?.data?.groups || ['VIP', 'Newsletter', 'Customers', 'Leads'];
      
      // Extract all unique groups from recipients
      const recipientGroups = fetchedRecipients
        .flatMap((r: Recipient) => r.groups || [])
        .filter((group: string) => group && group.trim() !== '');
      
      // Merge saved groups with recipient groups
      const uniqueGroups = Array.from(new Set([...savedGroups, ...recipientGroups]));
      setGroups(uniqueGroups);
    })
    .catch(err => console.error('Error fetching data:', err instanceof Error ? err.message : String(err)))
    .finally(() => setIsLoading(false));
  }, [user?.uid]);

  const addNewGroup = async () => {
    const uid = user?.uid;
    if (!uid) return toast.error('You must be signed in');
    if (!newGroupName.trim()) return toast.error('Group name cannot be empty');
    if (groups.includes(newGroupName.trim())) return toast.error('Group already exists');
    
    try {
      // Save the new group to Firebase by creating a groups list document
      const { saveGroupsToFirebase } = await import('../_utils/firebase-operations');
      const updatedGroups = [...groups, newGroupName.trim()];
      
      const resp = await saveGroupsToFirebase({ 
        userId: uid, 
        groups: updatedGroups 
      });
      
      if (resp.code === 777) {
        setGroups(updatedGroups);
        setNewGroupName('');
        toast.success(`Group "${newGroupName}" created`);
      } else {
        toast.error('Failed to create group');
      }
    } catch (err) {
      toast.error('Error creating group: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const deleteGroup = async (groupName: string) => {
    const uid = user?.uid;
    if (!uid) return toast.error('You must be signed in');
    
    if (window.confirm(`Delete group "${groupName}"? Recipients will not be deleted.`)) {
      try {
        // Get all recipients that have this group
        const affectedRecipients = recipients.filter(r => r.groups?.includes(groupName));
        
        if (affectedRecipients.length > 0) {
          const { updateRecipientGroups } = await import('../_utils/firebase-operations');
          
          // Update each affected recipient in Firebase
          const promises = affectedRecipients.map(recipient => {
            const updatedGroups = recipient.groups?.filter(g => g !== groupName) || [];
            return updateRecipientGroups({ 
              userId: uid, 
              email: recipient.email, 
              groups: updatedGroups 
            });
          });

          const results = await Promise.all(promises);
          
          // Check if all updates were successful
          if (!results.every(r => r.code === 777)) {
            toast.error('Some recipients failed to update');
            return;
          }
        }
        
        // Update the groups list in Firebase
        const { saveGroupsToFirebase } = await import('../_utils/firebase-operations');
        const updatedGroups = groups.filter(g => g !== groupName);
        const resp = await saveGroupsToFirebase({ userId: uid, groups: updatedGroups });
        
        if (resp.code === 777) {
          // Update local state after successful Firebase update
          setGroups(updatedGroups);
          setRecipients(recipients.map(r => ({
            ...r,
            groups: r.groups?.filter(g => g !== groupName)
          })));
          
          toast.success(`Group "${groupName}" deleted`);
        } else {
          toast.error('Failed to delete group');
        }
      } catch (err) {
        toast.error('Error deleting group: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
  };

  const addRecipientToGroup = async (recipient: Recipient, groupName: string) => {
    const uid = user?.uid;
    if (!uid) return toast.error('You must be signed in');

    const currentGroups = recipient.groups || [];
    if (currentGroups.includes(groupName)) return; // Already in group

    const updatedGroups = [...currentGroups, groupName];
    
    try {
      // Update in Firebase
      const { updateRecipientGroups } = await import('../_utils/firebase-operations');
      const resp = await updateRecipientGroups({ 
        userId: uid, 
        email: recipient.email, 
        groups: updatedGroups 
      });
      
      if (resp.code === 777) {
        // Update local state
        setRecipients(recipients.map(r => {
          if (r.email === recipient.email) {
            return { ...r, groups: updatedGroups };
          }
          return r;
        }));
        
        // Add group to global groups list if it doesn't exist
        if (!groups.includes(groupName)) {
          setGroups([...groups, groupName]);
        }
        
        toast.success(`Added to ${groupName}`);
      } else {
        toast.error('Failed to update groups');
      }
    } catch (err) {
      toast.error('Error updating groups: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const removeRecipientFromGroup = async (recipient: Recipient, groupName: string) => {
    const uid = user?.uid;
    if (!uid) return toast.error('You must be signed in');

    const updatedGroups = recipient.groups?.filter(g => g !== groupName) || [];
    
    try {
      // Update in Firebase
      const { updateRecipientGroups } = await import('../_utils/firebase-operations');
      const resp = await updateRecipientGroups({ 
        userId: uid, 
        email: recipient.email, 
        groups: updatedGroups 
      });
      
      if (resp.code === 777) {
        // Update local state
        setRecipients(recipients.map(r => {
          if (r.email === recipient.email) {
            return { ...r, groups: updatedGroups };
          }
          return r;
        }));
        toast.success(`Removed from ${groupName}`);
      } else {
        toast.error('Failed to update groups');
      }
    } catch (err) {
      toast.error('Error updating groups: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const addSelectedToGroup = async (groupName: string) => {
    const uid = user?.uid;
    if (!uid) return toast.error('You must be signed in');
    if (selectedEmails.length === 0) return toast.error('No recipients selected');

    try {
      const { updateMultipleRecipientGroups } = await import('../_utils/firebase-operations');
      
      // Get all selected recipients
      const selectedRecipients = recipients.filter(r => selectedEmails.includes(r.email));
      
      // Prepare updates for recipients that don't already have the group
      const recipientsToUpdate = selectedRecipients
        .filter(r => {
          const currentGroups = r.groups || [];
          return !currentGroups.includes(groupName);
        });

      if (recipientsToUpdate.length === 0) {
        toast.info('All selected recipients already have this group');
        setShowBulkGroupModal(false);
        return;
      }

      // Prepare the updates map: email -> new groups array
      const groupUpdates = recipientsToUpdate.reduce((acc, r) => {
        const currentGroups = r.groups || [];
        acc[r.email] = [...currentGroups, groupName];
        return acc;
      }, {} as Record<string, string[]>);

      // Update all recipients in a single Firebase transaction
      const result = await updateMultipleRecipientGroups({ 
        userId: uid, 
        groupUpdates 
      });
      
      if (result.code === 777) {
        // Update local state for all recipients that were updated
        setRecipients(recipients.map(r => {
          if (groupUpdates[r.email]) {
            return { ...r, groups: groupUpdates[r.email] };
          }
          return r;
        }));
        
        // Add group to global groups list if it doesn't exist
        if (!groups.includes(groupName)) {
          setGroups([...groups, groupName]);
        }
        
        const alreadyHadGroup = selectedRecipients.length - recipientsToUpdate.length;
        const message = alreadyHadGroup > 0 
          ? `Added ${recipientsToUpdate.length} recipient(s) to ${groupName} (${alreadyHadGroup} already had it)`
          : `Added ${recipientsToUpdate.length} recipient(s) to ${groupName}`;
        
        toast.success(message);
        setShowBulkGroupModal(false);
      } else {
        toast.error('Failed to update groups: ' + result.message);
      }
    } catch (err) {
      toast.error('Error updating groups: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const removeSelectedFromGroup = async (groupName: string) => {
    const uid = user?.uid;
    if (!uid) return toast.error('You must be signed in');
    if (selectedEmails.length === 0) return toast.error('No recipients selected');

    try {
      const { updateMultipleRecipientGroups } = await import('../_utils/firebase-operations');
      
      // Filter recipients that have this group
      const recipientsToUpdate = recipients
        .filter(r => selectedEmails.includes(r.email) && r.groups?.includes(groupName));

      if (recipientsToUpdate.length === 0) {
        toast.info('No selected recipients have this group');
        setShowBulkGroupModal(false);
        return;
      }

      // Prepare the updates map: email -> new groups array
      const groupUpdates = recipientsToUpdate.reduce((acc, r) => {
        const updatedGroups = r.groups?.filter(g => g !== groupName) || [];
        acc[r.email] = updatedGroups;
        return acc;
      }, {} as Record<string, string[]>);

      // Update all recipients in a single Firebase transaction
      const result = await updateMultipleRecipientGroups({ 
        userId: uid, 
        groupUpdates 
      });
      
      if (result.code === 777) {
        // Update local state
        setRecipients(recipients.map(r => {
          if (groupUpdates[r.email]) {
            return { ...r, groups: groupUpdates[r.email] };
          }
          return r;
        }));
        
        toast.success(`Removed ${recipientsToUpdate.length} recipient(s) from ${groupName}`);
        setShowBulkGroupModal(false);
      } else {
        toast.error('Failed to update groups: ' + result.message);
      }
    } catch (err) {
      toast.error('Error updating groups: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

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
    } else {
      if (recipients.length === 0) return toast.info('No recipients to delete');
      emailsToDelete = recipients.map(r => r.email);
    }

    try {
      setDeletingBulk(true);
      const resp = await removeRecipientsFromFirebase({ userId: uid, emails: emailsToDelete });
      if (resp.code === 777) {
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

  // Filter recipients by selected group
  const filteredRecipients = selectedGroup === 'All' 
    ? recipients 
    : recipients.filter(r => r.groups?.includes(selectedGroup));

  const rowPerPage = 10;
  const lastIndex = rowPerPage * currentPage;
  const firstIndex = lastIndex - rowPerPage;
  const records = filteredRecipients.slice(firstIndex, lastIndex);
  const nPage = Math.ceil(filteredRecipients.length / rowPerPage);
  const numbers = [...Array(nPage + 1).keys()].slice(1);

  const handlePrev = () => {
    if(currentPage !== 1){
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if(currentPage !== nPage){
      setCurrentPage(currentPage + 1);
    }
  };

  function handlePage (id: number) {
    setCurrentPage(id);
  }

  return (
    <Protected>
      <div className="sm:mt-21 bg-gradient-to-br from-red-200 to-slate-500 min-h-screen p-4">  
        <div className="relative overflow-x-auto mt-20 sm:ml-80 sm:mr-70">
          
          {/* Group Filter Bar */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                Groups
              </h3>
              <button 
                onClick={() => setShowGroupPanel(!showGroupPanel)}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                {showGroupPanel ? 'Hide' : 'Manage Groups'}
              </button>
            </div>

            {/* Group Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setSelectedGroup('All'); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedGroup === 'All' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({recipients.length})
              </button>
              {groups.map(group => (
                <button
                  key={group}
                  onClick={() => { setSelectedGroup(group); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedGroup === group 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {group} ({recipients.filter(r => r.groups?.includes(group)).length})
                </button>
              ))}
            </div>

            {/* Group Management Panel */}
            {showGroupPanel && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3">Manage Groups</h4>
                
                {/* Create New Group */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="New group name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && addNewGroup()}
                  />
                  <button
                    onClick={addNewGroup}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Create Group
                  </button>
                </div>

                {/* Existing Groups */}
                <div className="space-y-2">
                  {groups.map(group => (
                    <div key={group} className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200">
                      <span className="font-medium text-gray-700">{group}</span>
                      <button
                        onClick={() => deleteGroup(group)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bulk Action Toolbar */}
          <div className="md:flex items-center justify-between mb-3 gap-3">
            <div className="flex items-center gap-2 flex-wrap mb-2 md:mb-0">
              <button onClick={() => toggleSelectAllOnPage()} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Toggle select page</button>
              <button 
                onClick={() => {
                  setBulkGroupAction('add');
                  setShowBulkGroupModal(true);
                }} 
                disabled={selectedEmails.length === 0} 
                className="px-3 py-1.5 bg-green-600 text-white rounded disabled:opacity-50 hover:bg-green-700 font-medium"
              >
                Add to Group ({selectedEmails.length})
              </button>
              <button 
                onClick={() => {
                  setBulkGroupAction('remove');
                  setShowBulkGroupModal(true);
                }} 
                disabled={selectedEmails.length === 0} 
                className="px-3 py-1.5 bg-orange-600 text-white rounded disabled:opacity-50 hover:bg-orange-700 font-medium"
              >
                Remove from Group ({selectedEmails.length})
              </button>
              <button onClick={() => setPendingBulkAction('selected')} disabled={selectedEmails.length === 0 || deletingBulk} className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50">Delete selected ({selectedEmails.length})</button>
              <button onClick={() => setPendingBulkAction('all')} disabled={filteredRecipients.length === 0 || deletingBulk} className="px-3 py-1 bg-red-700 text-white rounded disabled:opacity-50">Delete all ({filteredRecipients.length})</button>
            </div>
            <div>
              <span className="text-sm text-gray-600">Showing {firstIndex + 1} - {Math.min(lastIndex, filteredRecipients.length)} of {filteredRecipients.length}</span>
            </div>
          </div>

          {/* Bulk Action Confirmation */}
          {pendingBulkAction && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-center justify-between">
              <div className="text-sm text-gray-700">{pendingBulkAction === 'selected' ? `Delete ${selectedEmails.length} selected recipient(s)?` : `Delete ALL ${filteredRecipients.length} recipient(s)?`}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => confirmBulkDelete(pendingBulkAction)} disabled={deletingBulk} className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50">{deletingBulk ? 'Deleting…' : 'Confirm'}</button>
                <button onClick={() => setPendingBulkAction(null)} disabled={deletingBulk} className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50">Cancel</button>
              </div>
            </div>
          )}

          <ToastContainer position="top-right" autoClose={7000} hideProgressBar={false} closeOnClick draggable pauseOnHover theme={"light"} />
          
          {/* Recipients Table */}
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  <input type="checkbox" aria-label="Select all on page" onChange={toggleSelectAllOnPage} checked={records.length > 0 && records.every(r => selectedEmails.includes(r.email))} />
                </th>
                <th scope="col" className="px-6 py-3">NO.</th>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Username</th>
                <th scope="col" className="px-6 py-3">Email Address</th>
                <th scope="col" className="px-6 py-3">Groups</th>
                <th scope="col" className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading ? 
                records.map((recipient: Recipient, index: number) => (
                  <tr key={recipient.email} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
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
                    <td className="px-6 py-4">{firstIndex + index + 1}</td>
                    <td className="px-6 py-4">{recipient.name || '-'}</td>
                    <td className="px-6 py-4">{recipient.username || '-'}</td>
                    <td className="px-6 py-4">{recipient.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {recipient.groups && recipient.groups.length > 0 ? (
                          recipient.groups.map(group => (
                            <span key={group} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                              {group}
                              <button
                                onClick={() => removeRecipientFromGroup(recipient, group)}
                                className="hover:text-purple-900"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">No groups</span>
                        )}
                        <button
                          onClick={() => {
                            setRecipientToGroup(recipient);
                            setShowGroupModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          + Add to group
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {pendingDeleteEmail === recipient.email ? (
                        <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-1 rounded">
                          <span className="text-sm text-gray-700">Delete?</span>
                          <button
                            onClick={async () => {
                              if (!user?.uid) return toast.error('You must be signed in');
                              try {
                                setDeletingEmail(recipient.email);
                                const resp = await removeRecipientFromFirebase({ userId: user.uid, email: recipient.email });
                                if (resp.code === 777) {
                                  setRecipients(prev => prev.filter(p => p.email !== recipient.email));
                                  toast.success('Recipient deleted');
                                } else {
                                  toast.error('Delete failed');
                                }
                              } catch (err) {
                                toast.error('Error deleting');
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
                          className="font-medium text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
                :
                <tr>
                  <td colSpan={6} className="text-center px-6 py-4 text-gray-100 text-2xl">Loading...</td>
                </tr>
              }
            </tbody>
          </table>

          {/* Pagination */}
          <div className='mt-4'>
            <nav>
              <ul className='flex flex-row justify-center items-center gap-2'>
                <li className='page-item'>
                  <button className='bg-gray-100 px-2 rounded-xl hover:shadow-xl transform hover:scale-95 cursor-pointer' onClick={handlePrev}>Prev</button>
                </li>
                {numbers.map((n: number, i: number) => (
                  <li className={`page-item ${currentPage === n ? 'active' : ''}`} key={i}>
                    <button className={`${currentPage === n ? 'bg-red-900 text-white px-2 rounded-xl hover:shadow-xl transform hover:scale-95 cursor-pointer' : 'bg-red-100 px-2 rounded-xl hover:shadow-xl transform hover:scale-95 cursor-pointer'}`} onClick={() => handlePage(n)}>{n}</button>
                  </li>
                ))}
                <li className='page-item'>
                  <button className='bg-gray-100 px-2 rounded-xl hover:shadow-xl transform hover:scale-95 cursor-pointer' onClick={handleNext}>Next</button>
                </li>
              </ul>
            </nav> 
          </div>

          {/* Bulk Add/Remove Group Modal */}
          {showBulkGroupModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">
                  {bulkGroupAction === 'add' 
                    ? `Add ${selectedEmails.length} recipient(s) to a group` 
                    : `Remove ${selectedEmails.length} recipient(s) from a group`}
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {groups.map(group => {
                    // For remove action, show how many selected recipients have this group
                    const recipientsWithGroup = bulkGroupAction === 'remove' 
                      ? recipients.filter(r => selectedEmails.includes(r.email) && r.groups?.includes(group)).length
                      : 0;
                    
                    return (
                      <button
                        key={group}
                        onClick={() => bulkGroupAction === 'add' ? addSelectedToGroup(group) : removeSelectedFromGroup(group)}
                        className={`w-full text-left p-3 rounded border transition-all font-medium ${
                          bulkGroupAction === 'add'
                            ? 'hover:bg-green-50 border-gray-200 hover:border-green-300'
                            : recipientsWithGroup > 0
                            ? 'hover:bg-orange-50 border-gray-200 hover:border-orange-300'
                            : 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-100'
                        }`}
                        disabled={bulkGroupAction === 'remove' && recipientsWithGroup === 0}
                      >
                        <div className="flex items-center justify-between">
                          <span>{group}</span>
                          {bulkGroupAction === 'remove' && recipientsWithGroup > 0 && (
                            <span className="text-sm text-gray-500">({recipientsWithGroup} have this)</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowBulkGroupModal(false)}
                  className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add to Group Modal (Single Recipient) */}
          {showGroupModal && recipientToGroup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Add {recipientToGroup.email} to groups</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {groups.map(group => (
                    <label key={group} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recipientToGroup.groups?.includes(group) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            addRecipientToGroup(recipientToGroup, group);
                            setRecipientToGroup({ ...recipientToGroup, groups: [...(recipientToGroup.groups || []), group] });
                          } else {
                            removeRecipientFromGroup(recipientToGroup, group);
                            setRecipientToGroup({ ...recipientToGroup, groups: recipientToGroup.groups?.filter(g => g !== group) });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span>{group}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setRecipientToGroup(null);
                  }}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </Protected>
  );
}