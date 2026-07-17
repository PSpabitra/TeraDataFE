import React from 'react'
import Field from '../../common/Field'

const IicsForm = ({ values, onChange }) => {
  return (
    <>
      <Field
        label="Username"
        value={values.username}
        onChange={v => onChange('username', v)}
        required
      />
      <Field
        label="Password"
        value={values.password}
        onChange={v => onChange('password', v)}
        password
        required
      />
      <Field
        label="Region/URL (e.g. dm-us.informaticacloud.com)"
        value={values.region_url}
        onChange={v => onChange('region_url', v)}
        required
      />
    </>
  )
}

export default IicsForm
