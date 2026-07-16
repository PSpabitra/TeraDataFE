import React, { useState, useEffect } from 'react';
import { ArrowRight, Database, Play, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import '../index.css';

const DatastageMigrationPage = () => {
  const [connections, setConnections] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [jobStatus, setJobStatus] = useState(null);
  
  const [sourceTable, setSourceTable] = useState('');
  const [targetPath, setTargetPath] = useState('');
  const [hostUrl, setHostUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  
  useEffect(() => {
    // Fetch mock initial data
    const fetchMetadata = async () => {
      try {
        const connRes = await fetch('http://localhost:3006/api/v1/migration/datastage-connections');
        const workspacesRes = await fetch('http://localhost:3006/api/v1/migration/databricks-workspaces');
        setConnections(await connRes.json());
        setWorkspaces(await workspacesRes.json());
      } catch (err) {
        console.error("Error fetching metadata", err);
      }
    };
    fetchMetadata();
  }, []);

  const startMigration = async () => {
    try {
      const res = await fetch('http://localhost:3006/api/v1/migration/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          source_table: sourceTable, 
          target_path: targetPath, 
          host_url: hostUrl,
          api_key: apiKey,
          project_id: projectId,
          mode: 'overwrite' 
        })
      });
      const data = await res.json();
      setJobStatus({ ...data, progress: 0 });
      pollStatus(data.job_id);
    } catch (err) {
      console.error("Migration failed to start", err);
    }
  };

  const pollStatus = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3006/api/v1/migration/status/${jobId}`);
        const data = await res.json();
        setJobStatus(data);
        if (data.status === 'Completed' || data.status === 'Failed') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Error polling status", err);
        clearInterval(interval);
      }
    }, 2000);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">DataStage to Databricks Migration</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Source Config */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Database className="text-blue-500" /> Source: IBM DataStage
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Connection</label>
                <select className="w-full border rounded p-2 bg-gray-50">
                  {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Host URL</label>
                  <input 
                    type="text" 
                    className="w-full border rounded p-2 bg-gray-50 text-sm" 
                    value={hostUrl}
                    onChange={(e) => setHostUrl(e.target.value)}
                    placeholder="https://dataplatform.cloud.ibm.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input 
                    type="password" 
                    className="w-full border rounded p-2 bg-gray-50 text-sm" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="IBM Cloud API Key"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
                  <input 
                    type="text" 
                    className="w-full border rounded p-2 bg-gray-50 text-sm" 
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="e.g. 1cf6f1c1-..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source Table / Asset</label>
                  <input 
                    type="text" 
                    className="w-full border rounded p-2 bg-gray-50 text-sm" 
                    value={sourceTable}
                    onChange={(e) => setSourceTable(e.target.value)}
                    placeholder="orders.xlsx"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Target Config */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Database className="text-orange-500" /> Target: Databricks
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace</label>
                <select className="w-full border rounded p-2 bg-gray-50">
                  {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Path / Delta Table</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2 bg-gray-50" 
                  value={targetPath}
                  onChange={(e) => setTargetPath(e.target.value)}
                  placeholder="e.g. dbfs:/mnt/data/orders"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <button 
            onClick={startMigration}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-colors"
          >
            <Play size={20} /> Start Migration
          </button>
        </div>

        {/* Monitoring */}
        {jobStatus && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Job Status: {jobStatus.job_id}</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-700">{jobStatus.status}</span>
              <span className="text-sm text-gray-500">{jobStatus.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div 
                className="bg-green-500 h-4 rounded-full transition-all duration-500" 
                style={{ width: `${jobStatus.progress}%` }}
              ></div>
            </div>
            <p className="text-gray-600 text-sm flex items-center gap-2">
              {jobStatus.status === 'Completed' ? <CheckCircle className="text-green-500" size={16} /> : <Clock className="text-blue-500 animate-spin" size={16} />}
              {jobStatus.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatastageMigrationPage;
