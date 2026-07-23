import React from 'react';
import { Spin } from 'antd';
import { createStaticStyles } from 'antd-style';

const classNames = createStaticStyles(({ css }) => ({
  root: css`
    padding: 8px;
  `,
}));

const stylesObject = {
  indicator: {
    color: '#00d4ff',
  },
};

const stylesFn = ({ props }) => {
  if (props.size === 'small') {
    return {
      indicator: {
        color: '#722ed1',
      },
    };
  }
  return {};
};

const CustomSpinner = (props) => {
  const sharedProps = {
    classNames: { root: classNames.root },
    ...props
  };
  
  return <Spin {...sharedProps} styles={props.size === 'small' ? stylesFn : stylesObject} />;
};

export default CustomSpinner;
