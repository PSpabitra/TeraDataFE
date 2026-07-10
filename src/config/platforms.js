import TeradataForm from '../components/steps/connections/TeradataForm'
import MysqlForm from '../components/steps/connections/MysqlForm'
import MssqlForm from '../components/steps/connections/MssqlForm'
import DatabricksForm from '../components/steps/connections/DatabricksForm'
import SnowflakeForm from '../components/steps/connections/SnowflakeForm'
import SqlServerForm from '../components/steps/connections/SqlServerForm'

export const SOURCES = {
  teradata: {
    id: 'teradata',
    name: 'Teradata',
    description: 'Teradata Data Warehouse',
    defaultPort: 1025,
    formComponent: TeradataForm,
    label: 'Teradata'
  },
  mysql: {
    id: 'mysql',
    name: 'MySQL',
    description: 'MySQL Database',
    defaultPort: 3306,
    formComponent: MysqlForm,
    label: 'MySQL'
  },
  mssql: {
    id: 'mssql',
    name: 'MSSQL',
    description: 'SQL Server',
    defaultPort: 1433,
    formComponent: MssqlForm,
    label: 'MSSQL'
  }
}

export const TARGETS = {
  databricks: {
    id: 'databricks',
    name: 'Databricks',
    description: 'Databricks Lakehouse',
    isCloud: true,
    formComponent: DatabricksForm,
    label: 'Databricks',
    iconType: 'cloud',
    supportsProcedureTransformation: true
  },
  snowflake: {
    id: 'snowflake',
    name: 'Snowflake',
    description: 'Snowflake Data Cloud',
    isCloud: false,
    formComponent: SnowflakeForm,
    label: 'Snowflake',
    iconType: 'database'
  },
  sqlserver: {
    id: 'sqlserver',
    name: 'SQL Server',
    description: 'SQL Server (SSMS)',
    isCloud: false,
    formComponent: SqlServerForm,
    label: 'SQL Server',
    iconType: 'database'
  },
  mysql: {
    id: 'mysql',
    name: 'MySQL',
    description: 'MySQL Database',
    isCloud: false,
    formComponent: MysqlForm,
    label: 'MySQL',
    iconType: 'database'
  }
}
