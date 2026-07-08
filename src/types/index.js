/**
 * @typedef {Object} Persona
 * @property {string|number} id
 * @property {string} username
 */

/**
 * @typedef {Object} SourceConnection
 * @property {'teradata'|'mysql'|'mssql'} platform
 * @property {string} host
 * @property {string} username
 * @property {string} password
 * @property {string} [database]
 * @property {string|number} [port]
 */

/**
 * @typedef {Object} TargetConnection
 * @property {'databricks'|'snowflake'|'sqlserver'} platform
 * @property {string} host
 * @property {string} [token]
 * @property {string} [cluster_id]
 * @property {string} [warehouse_id]
 * @property {string} [username]
 * @property {string} [password]
 * @property {string} [database]
 * @property {string} [schema]
 */

/**
 * @typedef {Object} Dataset
 * @property {string|number} id
 * @property {string} name
 * @property {string} type
 * @property {string} [schema]
 * @property {string} [catalog]
 * @property {number} [row_count]
 * @property {number} [size_mb]
 * @property {string[]} [tags]
 */

/**
 * @typedef {Object} Pipeline
 * @property {string|number} id
 * @property {string} name
 * @property {string} type
 * @property {string} [status]
 */

/**
 * @typedef {Object} Resources
 * @property {Dataset[]} datasets
 * @property {Pipeline[]} pipelines
 * @property {Object} [summary]
 * @property {number} [summary.total_datasets]
 * @property {number} [summary.total_pipelines]
 * @property {number} [summary.total_views]
 * @property {number} [summary.total_size_gb]
 * @property {number} [summary.total_notebooks]
 */

/**
 * @typedef {Object} GapAnalysisItem
 * @property {string} name
 * @property {string} [replication_mode]
 * @property {boolean} [exists_in_target]
 * @property {'LOW'|'MEDIUM'|'HIGH'} risk
 * @property {number} [estimated_duration_min]
 */

/**
 * @typedef {Object} GapAnalysis
 * @property {Object} gap_analysis
 * @property {number} [gap_analysis.new_creates]
 * @property {number} [gap_analysis.incremental_updates]
 * @property {number} [gap_analysis.high_risk_items]
 * @property {number} [gap_analysis.total_size_mb]
 * @property {GapAnalysisItem[]} [gap_analysis.items]
 * @property {Array<{type: string, message: string}>} [recommendations]
 */

/**
 * @typedef {Object} ReplicationProgress
 * @property {'STARTED'|'ITEM_STARTED'|'ITEM_COMPLETED'|'ITEM_FAILED'|'COMPLETED'|'STEP'|'BATCH_LOADED'|'DATASET_SUCCESS'|'PIPELINE_SUCCESS'} status
 * @property {string} [item]
 * @property {string} [message]
 * @property {string} [error]
 * @property {string} [detail]
 * @property {number} [progress_pct]
 * @property {string} timestamp
 */

/**
 * @typedef {Object} MigrationSummaryDetail
 * @property {string} name
 * @property {string} type
 * @property {string} sourceTable
 * @property {number} sourceRows
 * @property {string} targetTable
 * @property {number} inserted
 * @property {number} failedRows
 * @property {'Success'|'Failed'|'Pending'} status
 */

/**
 * @typedef {Object} MigrationSummary
 * @property {number} total
 * @property {number} completed
 * @property {number} failed
 * @property {MigrationSummaryDetail[]} details
 */

export {}
