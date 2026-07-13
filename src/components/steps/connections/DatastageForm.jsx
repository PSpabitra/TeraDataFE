import React from 'react'
import Field from '../../common/Field'

const DatastageForm = ({ values, onChange }) => {
  return (
    <>
      <Field
        label="Host URL"
        value={values.host}
        onChange={v => onChange('host', v)}
        placeholder="https://datastage-host.com"
        required
      />
      <Field
        label="Username"
        value={values.username}
        onChange={v => onChange('username', v)}
        placeholder="admin"
        required
      />
      <Field
        label="Password"
        value={values.password}
        onChange={v => onChange('password', v)}
        password
        required
      />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
        <Field
          label="Project Name"
          value={values.database}
          onChange={v => onChange('database', v)}
          placeholder="default_project"
        />
        <Field
          label="Port"
          value={values.port}
          onChange={v => onChange('port', v)}
          placeholder="443"
        />
      </div>
    </>
  )
}

export default DatastageForm
