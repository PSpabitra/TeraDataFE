import React from 'react'
import Field from '../../common/Field'

const SnowflakeForm = ({ values, onChange }) => {
  return (
    <>
      <Field
        label="Account URL / Host"
        value={values.host}
        onChange={v => onChange('host', v)}
        placeholder="xy12345.snowflakecomputing.com"
        required
      />
      <Field
        label="Username"
        value={values.username}
        onChange={v => onChange('username', v)}
        placeholder="snowflake_user"
        required
      />
      <Field
        label="Password"
        value={values.password}
        onChange={v => onChange('password', v)}
        password
        placeholder="••••••••"
        required
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field
          label="Database"
          value={values.database}
          onChange={v => onChange('database', v)}
          placeholder="MY_DATABASE"
        />
        <Field
          label="Warehouse"
          value={values.warehouse_id}
          onChange={v => onChange('warehouse_id', v)}
          placeholder="COMPUTE_WH"
        />
      </div>
      <Field
        label="Schema"
        value={values.schema}
        onChange={v => onChange('schema', v)}
        placeholder="PUBLIC"
      />
    </>
  )
}

export default SnowflakeForm
