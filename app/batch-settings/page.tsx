"use client";
import { useState } from "react";
import { uploadBatchSettingsToFirebase } from '../_utils/firebase-operations.tsx';
import { toast, ToastContainer } from 'react-toastify';

export default function BatchSettings() {
const [batchSize, setBatchSize] = useState(10);
const [delayBetweenBatches, setDelayBetweenBatches] = useState(1000);
const [isloading, setIsLoading] = useState(false);

const saveBatchSettings = async () => {
  try{
    setIsLoading(true)
    const response = await uploadBatchSettingsToFirebase({userId: '12', batchsize: batchSize.toString(), batchdelay: delayBetweenBatches.toString()});
    console.log(response)
    if(response.code === 777){
      toast.success(response.message);
      setIsLoading(false);
    }
    if(response.code === 101){
      toast.error(response.message);
      setIsLoading(false);
    }
  }catch(error){
    toast.error('Connection error: ' + error.message);
    setIsLoading(false);
  }
}

    return (
        <div className="sm:mt-21 bg-gradient-to-br from-red-200 to-slate-500 min-h-screen p-4 sm:ml-64 mt-5">
        <div className="max-w-4xl mx-auto">
    <div className="bg-gradient-to-br from-white to-slate-200 rounded-xl p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Batch Settings</h2>
      <ToastContainer position="top-right" autoClose={7000} hideProgressBar={false} closeOnClick draggable pauseOnHover theme={"light"} />
      <div className="bg-yellow-50 p-6 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-4">Configure Batch Processing</h3>
        
        <div className="space-y-6">
          {/* Batch Size Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Size (emails per batch)
            </label>
            <input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg"
              min="1"
              max="100"
            />
            <p className="text-sm text-gray-600 mt-2">
              Recommended: 10-50 for optimal performance. Higher values = faster but more risk of rate limiting.
            </p>
          </div>
          
          {/* Delay Between Batches */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delay Between Batches (milliseconds)
            </label>
            <input
              type="number"
              value={delayBetweenBatches}
              onChange={(e) => setDelayBetweenBatches(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg"
              min="0"
              max="10000"
              step="100"
            />
            <p className="text-sm text-gray-600 mt-2">
              Recommended: 500-2000ms to avoid rate limiting. Lower values = faster but higher risk.
            </p>
          </div>
          
          {/* Current Configuration Summary */}
          <div className="bg-white p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-gray-800 mb-2">Current Configuration</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                • Sending <span className="font-semibold text-gray-800">{batchSize}</span> emails per batch
              </p>
              <p>
                • Waiting <span className="font-semibold text-gray-800">{delayBetweenBatches}ms</span> between batches
              </p>
              <p>
                • Estimated time for 20,000 emails: 
                <span className="font-semibold text-indigo-600">
                  {Math.ceil((20000 / batchSize) * delayBetweenBatches / 60000)} minutes
                </span>
              </p>
            </div>
          </div>

              <div className="mt-4">
                <button
                  onClick={saveBatchSettings}
                  disabled={isloading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
                >
                  {isloading ? (
                    <span>Loading...</span>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
              </div>

        </div>
      </div>
    </div>
  </div>
        </div>
    );
}