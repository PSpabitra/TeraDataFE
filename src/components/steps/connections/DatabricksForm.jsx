import React from 'react'
import Field from '../../common/Field'

const DatabricksForm = ({ values, onChange }) => {
  return (
    <>
      <Field
        label="Workspace URL"
        value={values.host}
        onChange={v => onChange('host', v)}
        placeholder="https://adb-xxx.azuredatabricks.net"
        required
      />
      <Field
        label="Access Token"
        value={values.token}
        onChange={v => onChange('token', v)}
        password
        placeholder="dapi..."
        required
      />
      <Field
        label="Cluster ID"
        value={values.cluster_id}
        onChange={v => onChange('cluster_id', v)}
        placeholder="0101-123456-abc"
      />
      <Field
        label="SQL Warehouse ID"
        value={values.warehouse_id}
        onChange={v => onChange('warehouse_id', v)}
        placeholder="abc123def"
      />
    </>
  )
}

export default DatabricksForm
