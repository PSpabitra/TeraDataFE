import React from 'react'
import Field from '../../common/Field'

const SqlServerForm = ({ values, onChange }) => {
  return (
    <>
      <Field
        label="Server Host"
        value={values.host}
        onChange={v => onChange('host', v)}
        placeholder="localhost or 192.168.1.100"
        required
      />
      <Field
        label="Username"
        value={values.username}
        onChange={v => onChange('username', v)}
        placeholder="sa"
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
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
        <Field
          label="Database"
          value={values.database}
          onChange={v => onChange('database', v)}
          placeholder="TargetDB"
        />
        <Field
          label="Port"
          value={values.warehouse_id}
          onChange={v => onChange('warehouse_id', v)}
          placeholder="1433"
        />
      </div>
    </>
  )
}

export default SqlServerForm
