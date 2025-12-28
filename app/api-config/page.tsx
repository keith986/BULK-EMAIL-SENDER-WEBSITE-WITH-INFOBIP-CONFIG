"use client";
import Protected from '../_components/Protected';
import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { toast, ToastContainer } from 'react-toastify';
import { fetchApiKeyFromFirebase } from '../_utils/firebase-operations';
//import {uploadApiDataToFirebase, deleteApiDataToFirebase} from '../_utils/firebase-operations';
import { useUser } from '../_context/UserProvider';

export default function ApiConfigPage(){
// API Configuration state
const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
const [baseUrl, setBaseUrl] = useState('https://api.infobip.com');
const [loading, setLoading] = useState(false);
const { user } = useUser();
//const [isLoading, setIsLoading] = useState(false);
//const [isDeleted, setIsDeleted] = useState(false);

// Fetch existing API key from Firebase (if any) when component mounts
useEffect(() => {
    if (user?.uid) {
      // Check configured status from server
      fetch(`/api/apitest?userId=${encodeURIComponent(user.uid)}`)
        .then(res => res.json())
        .then(data => {
          setIsConfigured(Boolean(data?.configured));
        })
        .catch(err => {
          console.error('Error checking API config status:', err);
          setIsConfigured(false);
        });
    }
  }, [user?.uid]);

/* Handle Toggle Eye for Api Key input
const handleToggleEye = () => {
  const toggleeye = document.getElementById('eyelid') as HTMLInputElement | null;
  if (!toggleeye) return;
  toggleeye.type = toggleeye.type === 'password' ? 'text' : 'password';
}
*/

  const testConnection = async () => {
  try {
    if (!user?.uid) return toast.error('User not identified');
    setLoading(true);
    const resp = await fetch('/api/apitest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.uid })
    });
    const data = await resp.json();
    setLoading(false);
    if (data?.code === 777) {
      toast.success('API connection successful!');
      setIsConfigured(true);
    } else {
      toast.error('API connection failed. Check your credentials.');
      setIsConfigured(false);
    }
  } catch (error) {
    toast.error('Connection error: ' + (error instanceof Error ? error.message : String(error)));
    setLoading(false);
  }
};

 /* Handle Save and Delete Api button
const saveApiKey = async () => {
  if (!apiKey) {
    toast.info("Api Key is required!");
    return;
  } else {
  try{
    setIsLoading(true)
    const response = await uploadApiDataToFirebase({userId: user?.uid as string, apiKey: apiKey});
    if(response.code == 777){
      toast.success(response.message);
      setIsLoading(false);
    }
    if(response.code == 101){
      toast.error(response.message);
      setIsLoading(false);
    }
  }catch(error){
    toast.error('Connection error: ' + (error instanceof Error ? error.message : String(error)));
    setIsLoading(false);
  }
  }
}

const handleDeleteApiKey = async () => {
  try{
    setIsDeleted(true)
    const response = await deleteApiDataToFirebase({userId: user?.uid as string});
    if(response.code == 777){
      toast.success(response.message);
      setIsDeleted(false);
    }
    if(response.code == 101){
      toast.error(response.message);
      setIsDeleted(false);
    }
  }catch(error){
    toast.error('Connection error: ' + (error instanceof Error ? error.message : String(error)));
    setIsDeleted(false);
  }
}
*/

  return (
    <Protected>
      <div className="sm:mt-21 bg-gradient-to-br from-red-200 to-slate-500 min-h-screen p-4 sm:ml-64 mt-5">
  <div className="max-w-4xl mx-auto mt-20">
    <div className="bg-gradient-to-br from-white to-slate-200 rounded-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">API Configuration</h2>
      <ToastContainer position="top-right" autoClose={7000} hideProgressBar={false} closeOnClick draggable pauseOnHover theme={"light"} />
      <div className="p-6 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-4">Infobip API Settings</h3>
        
        <div className="space-y-6">
          {/* API Key Input 
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Infobip API Key *
            </label>
            <input
              type="password"
              id="eyelid"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg"
              placeholder="Enter your Infobip API Key"
            />
            <Eye onClick={handleToggleEye} className="cursor-pointer transition-all delay-300 hover:scale-120"/> 
            <p className="text-sm text-gray-600 mt-2">
              Get your API key from the Infobip portal at infobip.com
            </p>
          </div>
          */}
          {/* Base URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg outline-none"
              readOnly
              placeholder="https://api.infobip.com"
            />
            <p className="text-sm text-gray-600 mt-2">
              Default: https://api.infobip.com (for Infobip Cloud)
            </p>
            {/* Save and Delete Buttons 
            <div className="mt-4 flex items-center gap-4 hidden">
                <button
                  onClick={saveApiKey}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
                >
                  {isLoading ? (
                    <span>Loading...</span>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
                <button disabled={isDeleted} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer" onClick={handleDeleteApiKey}>
                {isDeleted ? (
                  <span>deleting...</span>
                ) : (
                  <span>Delete Api Key</span>
                )}</button>
            </div>
            */}
          </div>
          
          {/* Configuration Status */}
          <div className="bg-white p-4 rounded-lg border border-indigo-200">
            <h4 className="font-semibold text-gray-800 mb-2">Configuration Status</h4>
            <div className="space-y-1 text-sm">
              {/* API Key Status */}
              <div className="flex items-center gap-2">
                {isConfigured ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">API configured (server-side)</span>
                  </>
                ) : isConfigured === false ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600 font-medium">API not configured</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-600">Checking...</span>
                  </>
                )}
              </div>
              
              {/* Base URL Status */}
              <div className="flex items-center gap-2">
                {baseUrl ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">Base URL configured</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600 font-medium">Base URL required</span>
                  </>
                )}
              </div>

              {/* Test Connection Button */}
              <div className="mt-4">
                <button
                  onClick={testConnection}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                >
                  {loading ? (
                    <span>Loading...</span>
                  ) : (
                    <span>Test Connection</span>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
        </div>
      </Protected>
      );
}