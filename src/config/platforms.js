import TeradataForm from '../components/steps/connections/TeradataForm'
import MysqlForm from '../components/steps/connections/MysqlForm'
import MssqlForm from '../components/steps/connections/MssqlForm'
import PostgresForm from '../components/steps/connections/PostgresForm'
import DatabricksForm from '../components/steps/connections/DatabricksForm'
import SnowflakeForm from '../components/steps/connections/SnowflakeForm'
import SqlServerForm from '../components/steps/connections/SqlServerForm'
import DatastageForm from '../components/steps/connections/DatastageForm'
import AdfForm from '../components/steps/connections/AdfForm'
import IicsForm from '../components/steps/connections/IicsForm'

export const SOURCES = {
  datastage: {
    id: 'datastage',
    name: 'DataStage',
    description: 'IBM DataStage',
    defaultPort: 443,
    formComponent: DatastageForm,
    label: 'DataStage'
  },
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
    description: 'MSSQL',
    defaultPort: 1433,
    formComponent: MssqlForm,
    label: 'MSSQL'
  },
  postgres: {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'PostgreSQL Database',
    defaultPort: 5432,
    formComponent: PostgresForm,
    label: 'PostgreSQL'
  },
  adf: {
    id: 'adf',
    name: 'Azure Data Factory',
    description: 'Azure Data Factory',
    defaultPort: null,
    formComponent: AdfForm,
    label: 'ADF'
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
    name: 'MSSQL',
    description: 'MSSQL',
    isCloud: false,
    formComponent: SqlServerForm,
    label: 'MSSQL',
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
  },
  iics: {
    id: 'iics',
    name: 'Informatica (IICS)',
    description: 'Informatica Intelligent Cloud Services',
    isCloud: true,
    formComponent: IicsForm,
    label: 'IICS',
    iconType: 'cloud'
  },
  adf: {
    id: 'adf',
    name: 'Azure Data Factory',
    description: 'Azure Data Factory',
    isCloud: true,
    formComponent: AdfForm,
    label: 'ADF',
    iconType: 'cloud'
  }
}
