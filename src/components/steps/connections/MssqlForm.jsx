import React from 'react'
import Field from '../../common/Field'

const MssqlForm = ({ values, onChange }) => {
  return (
    <>
      <Field
        label="Host"
        value={values.host}
        onChange={v => onChange('host', v)}
        placeholder="localhost"
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
        required
      />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
        <Field
          label="Database"
          value={values.database}
          onChange={v => onChange('database', v)}
          placeholder="master"
        />
        <Field
          label="Port"
          value={values.port}
          onChange={v => onChange('port', v)}
          placeholder="1433"
        />
      </div>
    </>
  )
}

export default MssqlForm
