'use client';

import React, { useState, useRef, Fragment } from 'react';

type DemoState = 'idle' | 'running' | 'validating' | 'deploying' | 'monitoring' | 'breached' | 'remediating' | 'finished';
type WorkflowSteps = Record<string, string>;
type RemediationSteps = Record<string, string>;

interface LogEntry {
  agent: string;
  message: string;
  icon: string;
  agentClass: string;
  id: number;
}

interface ValidatorContent {
  status?: 'running' | 'success';
  query?: string;
  result?: string;
  title?: string;
  content?: string;
}

interface ComplianceContent {
  status?: 'active' | 'discovering' | 'executing';
  result?: string;
  title?: string;
  content?: string;
  message?: string;
}

export default function App() {
  const [demoState, setDemoState] = useState<DemoState>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowSteps>({});
  const [remediationSteps, setRemediationSteps] = useState<RemediationSteps>({});
  const [validatorContent, setValidatorContent] = useState<ValidatorContent | null>(null);
  const [complianceContent, setComplianceContent] = useState<ComplianceContent | null>(null);
  const [isChartFailing, setIsChartFailing] = useState<boolean>(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  const addLog = (agent: string, message: string, icon: string, agentClass: string) => {
    const newLog: LogEntry = { agent, message, icon, agentClass, id: Date.now() + Math.random() };
    setLogs(prev => [newLog, ...prev]);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const startDemo = async () => {
    if (demoState === 'running') return;

    resetDemo();
    setDemoState('running');
    addLog('System', 'Initiating DeployGuard workflow simulation...', 'fa-server', 'log-system');
    
    // FIX: Simulate the backend event stream directly in the frontend.
    // This avoids the "Invalid URL" error for EventSource in sandboxed environments.
    // For local development with a real Next.js server, you would use the commented-out EventSource code.
    const simulateBackendWorkflow = async () => {
        const modelName = 'CustomerChurn-v3';
        const deploymentId = `deploy-${Date.now()}`;

        handleWorkflowEvent({ type: 'workflow:start', run: { context: { modelName } } });
        await sleep(500);

        // Step 1: Validation
        handleWorkflowEvent({ type: 'step:start', step: { name: 'Pre-Deployment Validation' } });
        await sleep(500);
        handleWorkflowEvent({ type: 'tool:start', agent: { name: 'ValidatorAgent' }, tool: { name: 'llamaIndexValidator' } });
        await sleep(1500);
        const validationResult = { status: 'success', reason: 'Model output aligns with fairness guidelines.', confidence: 0.98 };
        handleWorkflowEvent({ type: 'tool:finish', agent: { name: 'ValidatorAgent' }, tool: { name: 'llamaIndexValidator' }, result: validationResult });
        await sleep(200);
        handleWorkflowEvent({ type: 'step:finish', step: { name: 'Pre-Deployment Validation', result: { result: validationResult } } });
        await sleep(500);

        // Step 2: Deployment
        handleWorkflowEvent({ type: 'step:start', step: { name: 'Deploy to Production' } });
        await sleep(1000);
        handleWorkflowEvent({ type: 'step:finish', step: { name: 'Deploy to Production', result: { deploymentId } } });
        await sleep(500);

        // Step 3: Monitoring
        handleWorkflowEvent({ type: 'step:start', step: { name: 'Initiate Continuous Monitoring' } });
        await sleep(500);
        handleWorkflowEvent({ type: 'tool:start', agent: { name: 'ComplianceAgent' }, tool: { name: 'datadogMonitor' } });
        await sleep(500);
        const monitorResult = { monitoring_status: 'active', dashboard_url: `https://app.datadoghq.com/dashboard/abc-123` };
        handleWorkflowEvent({ type: 'tool:finish', agent: { name: 'ComplianceAgent' }, tool: { name: 'datadogMonitor' }, result: monitorResult });
        await sleep(200);
        handleWorkflowEvent({ type: 'step:finish', step: { name: 'Initiate Continuous Monitoring', result: { result: monitorResult } } });
        await sleep(500);

        // Finish Workflow
        handleWorkflowEvent({ type: 'workflow:finish' });
    };

    await simulateBackendWorkflow();

    /*
    // --- Code for REAL local development ---
    // Restore the EventSource for local development
    eventSourceRef.current = new EventSource('/api/deploy');

    eventSourceRef.current.onopen = () => {
        addLog('System', 'Connection established. Initiating workflow.', 'fa-server', 'log-system');
    };

    eventSourceRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWorkflowEvent(data);
    };

    eventSourceRef.current.onerror = () => {
        addLog('System', 'Connection error. Make sure the backend is running.', 'fa-exclamation-circle', 'log-system');
        setDemoState('idle');
        eventSourceRef.current?.close();
    };
    */
  };

  const handleWorkflowEvent = (event: any) => {
    switch (event.type) {
        case 'workflow:start':
            addLog('Orchestration Agent', 'Deployment workflow initiated for model: ' + event.run.context.modelName, 'fa-cogs', 'log-orchestration');
            break;
        case 'step:start':
            setWorkflowSteps(prev => ({ ...prev, [event.step.name]: 'active' }));
            addLog('Orchestration Agent', `Starting step: "${event.step.name}"`, 'fa-cogs', 'log-orchestration');
            if (event.step.name === 'Pre-Deployment Validation') {
                setValidatorContent({ status: 'running', query: 'Querying LlamaIndex RAG system...' });
            }
            break;
        case 'step:finish':
            setWorkflowSteps(prev => ({ ...prev, [event.step.name]: 'complete' }));
            addLog('Orchestration Agent', `Finished step: "${event.step.name}"`, 'fa-cogs', 'log-orchestration');
            if (event.step.name === 'Pre-Deployment Validation') {
                setValidatorContent({ status: 'success', result: event.step.result.result });
            }
            if (event.step.name === 'Initiate Continuous Monitoring') {
                setComplianceContent({ status: 'active', result: event.step.result.result });
            }
            break;
        case 'tool:start':
            const agentName = event.agent.name;
            const toolName = event.tool.name;
            addLog(agentName, `Calling tool: ${toolName}`, 'fa-wrench', agentName === 'ValidatorAgent' ? 'log-ValidatorAgent' : 'log-ComplianceAgent');
            
            if (toolName === 'connectToDatadogMCP') {
                setComplianceContent({ status: 'discovering', message: 'Connecting to Datadog MCP Server...' });
            }
            if (toolName === 'datadog_create_monitor') {
                setComplianceContent({ status: 'executing', message: 'Creating monitor in Datadog...' });
            }
            break;
        case 'tool:finish':
            addLog(event.agent.name, `Tool ${event.tool.name} finished successfully.`, 'fa-wrench', event.agent.name === 'ValidatorAgent' ? 'log-ValidatorAgent' : 'log-ComplianceAgent');
            break;
        case 'workflow:finish':
            addLog('System', 'Workflow completed successfully.', 'fa-check-circle', 'log-system');
            setDemoState('finished');
            eventSourceRef.current?.close();
            break;
        case 'error':
            addLog('System', `An error occurred: ${event.error}`, 'fa-exclamation-triangle', 'log-system');
            setDemoState('idle');
            eventSourceRef.current?.close();
            break;
    }
  };

  const simulateBreach = async () => {
    if (demoState !== 'finished') return;
    setDemoState('breached');
    addLog('SYSTEM', 'Simulating compliance breach...', 'fa-server', 'log-system');
    setIsChartFailing(true);

    await sleep(1000);
    addLog('Compliance Agent', '<strong class="text-red-400">ALERT:</strong> Fairness score dropped below threshold!', 'fa-bell', 'log-compliance');

    await sleep(1000);
    addLog('Orchestration Agent', 'Alert received! Triggering automated remediation workflow.', 'fa-cogs', 'log-orchestration');
    setRemediationSteps({ step1: 'active' });

    await sleep(1000);
    addLog('Orchestration Agent', 'Action: Sent high-priority alert to #devops on Slack.', 'fa-cogs', 'log-orchestration');
    setRemediationSteps(prev => ({ ...prev, step1: 'complete', step2: 'active' }));

    await sleep(1000);
    addLog('Orchestration Agent', 'Action: Created P0 incident ticket in Jira.', 'fa-cogs', 'log-orchestration');
    setRemediationSteps(prev => ({ ...prev, step2: 'complete', step3: 'active' }));

    await sleep(1000);
    addLog('Orchestration Agent', 'Action: Initiated automated rollback of the deployment.', 'fa-cogs', 'log-orchestration');
    setRemediationSteps(prev => ({ ...prev, step3: 'complete' }));
  };

  const resetDemo = () => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setDemoState('idle');
    setLogs([]);
    setWorkflowSteps({});
    setRemediationSteps({});
    setValidatorContent(null);
    setComplianceContent(null);
    setIsChartFailing(false);
  };

  const getStepClass = (status: 'active' | 'complete' | undefined) => {
      if (status === 'active') return 'step-active';
      if (status === 'complete') return 'step-complete';
      return 'step-inactive';
  };

  const workflowStepNames = ['Pre-Deployment Validation', 'Deploy to Production', 'Initiate Continuous Monitoring'];

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans antialiased">
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                <i className="fas fa-shield-halved text-blue-400"></i> DeployGuard
            </h1>
            <p className="text-lg text-gray-400">Next.js + Mastra (TypeScript)</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 flex items-center">
                        <img src="https://placehold.co/32x32/8b5cf6/ffffff?text=M" className="rounded-md mr-3" alt="Mastra Logo" />
                        Orchestration Agent <span className="text-sm ml-2 px-2 py-1 bg-violet-600/50 text-violet-300 rounded-full">Mastra</span>
                    </h2>
                    
                    <div className="flex flex-col md:flex-row items-center justify-around space-y-4 md:space-y-0 md:space-x-4 p-4 bg-gray-900 rounded-lg">
                        {workflowStepNames.map((name, i) => (
                            <Fragment key={name}>
                                <div className={`workflow-step text-center p-4 border-2 border-gray-600 rounded-lg transition-all duration-300 ${getStepClass(workflowSteps[name] as 'active' | 'complete' | undefined)}`}>
                                    <i className={`fas ${['fa-tasks', 'fa-rocket', 'fa-chart-line'][i]} text-3xl mb-2`}></i>
                                    <p>{i+1}. {name.split(' ')[0]}</p>
                                </div>
                                {i < workflowStepNames.length - 1 && <div className={`arrow text-2xl ${workflowSteps[name] === 'complete' ? 'arrow-lit' : ''}`}><i className="fas fa-arrow-right"></i></div>}
                            </Fragment>
                        ))}
                    </div>

                    {Object.keys(remediationSteps).length > 0 && (
                         <div className="mt-4">
                            <h3 className="text-lg font-semibold text-red-400 mb-2 text-center">Remediation Workflow Triggered!</h3>
                            <div className="flex flex-col md:flex-row items-center justify-around space-y-4 md:space-y-0 md:space-x-4 p-4 bg-red-900/30 border border-red-500 rounded-lg">
                                 <div className={`workflow-step text-center p-3 rounded-lg transition-all duration-300 ${remediationSteps.step1 ? 'opacity-100' : 'opacity-50'}`}><i className="fab fa-slack text-3xl mb-2"></i><p>Send Alert</p></div>
                                <div className="arrow text-2xl text-red-400"><i className="fas fa-arrow-right"></i></div>
                                 <div className={`workflow-step text-center p-3 rounded-lg transition-all duration-300 ${remediationSteps.step2 ? 'opacity-100' : 'opacity-50'}`}><i className="fas fa-clipboard-list text-3xl mb-2"></i><p>Create Ticket</p></div>
                                <div className="arrow text-2xl text-red-400"><i className="fas fa-arrow-right"></i></div>
                                 <div className={`workflow-step text-center p-3 rounded-lg transition-all duration-300 ${remediationSteps.step3 ? 'opacity-100' : 'opacity-50'}`}><i className="fas fa-undo text-3xl mb-2"></i><p>Rollback</p></div>
                            </div>
                        </div>
                    )}
                </div>

                <div id="demo-controls" className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
                    <h2 className="text-2xl font-bold mb-4">Demo Controls</h2>
                    <div className="flex justify-center space-x-4">
                        <button onClick={startDemo} disabled={demoState === 'running'} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none">
                            <i className="fas fa-play mr-2"></i>Start Deployment
                        </button>
                        <button onClick={simulateBreach} disabled={demoState !== 'finished'} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none">
                            <i className="fas fa-exclamation-triangle mr-2"></i>Simulate Compliance Breach
                        </button>
                         <button onClick={resetDemo} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105">
                            <i className="fas fa-redo mr-2"></i>Reset
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`bg-gray-800 p-6 rounded-xl border border-gray-700 transition-all duration-500 ${workflowSteps['Pre-Deployment Validation'] === 'active' ? 'border-blue-500 scale-105' : 'opacity-50'}`}>
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                           <img src="https://placehold.co/32x32/3b82f6/ffffff?text=V" className="rounded-md mr-3" alt="Validator Logo" />
                           Validator Agent <span className="text-sm ml-2 px-2 py-1 bg-blue-600/50 text-blue-300 rounded-full">LlamaIndex</span>
                        </h2>
                        <div className="space-y-3 text-gray-400">
                            {!validatorContent && <p>Awaiting deployment signal...</p>}
                            {validatorContent?.status === 'running' && <p>{validatorContent.query}</p>}
                            {validatorContent?.status === 'success' && validatorContent.result && (
                              <div className="bg-emerald-900/50 p-3 rounded-lg text-sm mt-2">
                                <p className="font-bold text-emerald-300"><i className="fas fa-check-circle mr-2"></i>Validation Passed</p>
                                {typeof validatorContent.result === 'object' ? (
                                  <pre className="text-gray-300">{JSON.stringify(validatorContent.result, null, 2)}</pre>
                                ) : (
                                  <p className="text-gray-300">{validatorContent.result}</p>
                                )}
                              </div>
                            )}
                        </div>
                    </div>

                    <div className={`bg-gray-800 p-6 rounded-xl border border-gray-700 transition-all duration-500 
                        ${isChartFailing ? 'glowing-border border-red-500' : ''} 
                        ${workflowSteps['Initiate Continuous Monitoring'] === 'active' ? 'border-blue-500 scale-105' : 'opacity-50'}
                        ${complianceContent?.status ? 'status-' + complianceContent.status : ''}`}>
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            <img src="https://placehold.co/32x32/ef4444/ffffff?text=C" className="rounded-md mr-3" alt="Compliance Logo" />
                            Compliance Agent <span className="text-sm ml-2 px-2 py-1 bg-red-600/50 text-red-300 rounded-full">Datadog MCP</span>
                        </h2>
                        <div className="space-y-3">
                            {!complianceContent && <p className="text-gray-400">Awaiting successful deployment...</p>}
                            
                            {complianceContent?.status === 'discovering' && (
                                <div className="flex items-center bg-amber-900/20 p-3 rounded-lg">
                                    <span className="status-indicator status-indicator-discovering"></span>
                                    <p className="text-amber-300">{complianceContent.message}</p>
                                </div>
                            )}
                            
                            {complianceContent?.status === 'executing' && (
                                <div className="flex items-center bg-violet-900/20 p-3 rounded-lg">
                                    <span className="status-indicator status-indicator-executing"></span>
                                    <p className="text-violet-300">{complianceContent.message}</p>
                                </div>
                            )}
                            
                            {complianceContent?.status === 'active' && (
                                <div>
                                    <div className="flex items-center mb-2">
                                        <span className="status-indicator status-indicator-active"></span>
                                        <p className="font-semibold text-emerald-300">Monitor Active</p>
                                    </div>
                                    <p className="font-semibold text-gray-300 mb-2">Fairness Score</p>
                                    <div className="bg-gray-900 p-2 rounded-lg">
                                        <svg viewBox="0 0 100 40" className="w-full h-auto">
                                            <path d={isChartFailing ? 'M 0 10 L 60 12 L 70 35 L 100 34' : 'M 0 10 L 100 10'} stroke={isChartFailing ? '#ef4444' : '#22c55e'} strokeWidth="2" fill="none" className="transition-all duration-500" />
                                            <line x1="0" y1="30" x2="100" y2="30" stroke="#ef4444" strokeWidth="1" strokeDasharray="2"/>
                                            <text x="2" y="38" fontSize="4" fill="#ef4444">Threshold</text>
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-1 bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <img src="https://placehold.co/32x32/10b981/ffffff?text=S" className="rounded-md mr-3" alt="Senso.ai Logo" />
                    Context OS <span className="text-sm ml-2 px-2 py-1 bg-emerald-600/50 text-emerald-300 rounded-full">Senso.ai</span>
                </h2>
                <div className="h-96 lg:h-[calc(100%-4rem)] bg-gray-900 rounded-lg p-3 space-y-3 overflow-y-auto flex flex-col-reverse">
                    {logs.length === 0 && <p className="text-gray-500 text-center m-auto">Event log will appear here...</p>}
                    {logs.map(log => (
                        <div key={log.id} className={`log-entry p-2 rounded-md bg-gray-800/50 text-sm ${log.agentClass}`}>
                            <p className="font-bold text-white"><i className={`fas ${log.icon} mr-2`}></i>{log.agent}</p>
                            <p className="text-gray-300 ml-5" dangerouslySetInnerHTML={{__html: log.message}}></p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}