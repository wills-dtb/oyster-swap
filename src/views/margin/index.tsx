import React from "react";
import { Button, Card, Popover } from "antd";
import { Settings } from "./../../components/settings";
import { SettingOutlined } from "@ant-design/icons";
import { AppBar } from "./../../components/appBar";
import { useHistory, useLocation } from "react-router-dom";
import { MarginEntry, PositionType } from "../../components/margin";

export const MarginView = (props: {}) => {
  const tabStyle: React.CSSProperties = { width: 120 };
  const tabList = [
    {
      key: "margin-long",
      tab: <div title="long" style={{...tabStyle, color: 'green' }}>Bull 🐮 </div>,
      render: () => {
        return <MarginEntry type={PositionType.Long} />;
      },
    },
    {
      key: "margin-short",
      tab: <div title="short" style={{...tabStyle, color: 'red' }}>Bear 🐻 </div>,
      render: () => {
        return <MarginEntry type={PositionType.Short} />;
      },
    },
  ];

  const location = useLocation();
  const history = useHistory();
  const activeTab = location.pathname.indexOf("bear") < 0 ? "margin-long" : "margin-short";

  const handleTabChange = (key: any) => {
    if (activeTab !== key) {
      if (key === "margin-long") {
        history.push("/bull");
      } else {
        history.push("/bear");
      }
    }
  };

  return (
    <>
      <AppBar
        right={
          <Popover
            placement="topRight"
            title="Settings"
            content={<Settings />}
            trigger="click"
          >
            <Button
              shape="circle"
              size="large"
              type="text"
              icon={<SettingOutlined />}
            />
          </Popover>
        }
      />
      <Card
        className="exchange-card"
        headStyle={{ padding: 0 }}
        bodyStyle={{ position: "relative" }}
        tabList={tabList}
        tabProps={{
          tabBarGutter: 0,
        }}
        activeTabKey={activeTab}
        onTabChange={(key) => {
          handleTabChange(key);
        }}
      >
        {tabList.find((t) => t.key === activeTab)?.render()}
      </Card>
    </>
  );
};
