import React from 'react'
import Field from '../../common/Field'

const DatastageForm = ({ values, onChange }) => {
  return (
    <>
      <Field
        label="Host URL"
        value={values.host}
        onChange={v => onChange('host', v)}
        placeholder="https://ca-tor.dai.cloud.ibm.com"
        required
      />
      <Field
        label="Username"
        value={values.username}
        onChange={v => onChange('username', v)}
        placeholder="mr.subhajitofficialmail@gmail.com"
        required
      />
      <Field
        label="API Key"
        value={values.password}
        onChange={v => onChange('password', v)}
        password
        required
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field
          label="Project Name"
          value={values.project_name}
          onChange={v => onChange('project_name', v)}
          placeholder="Subhajit's Sandbox Project"
          required
        />
        <Field
          label="Project ID"
          value={values.database || values.project_id || ''}
          onChange={v => {
            onChange('project_id', v);
            onChange('database', v);
          }}
          placeholder="41001099-5063-403c-ac77-f22e32e77fe0"
          required
        />
      </div>
    </>
  )
}

export default DatastageForm
