const App = {
  template: `
    <el-container class="main-container">
        <el-header class="app-header">
            <div class="logo">
                <i class="el-icon-document-checked"></i>
                <router-link to="/" class="logo-link">报告生成工具</router-link>
            </div>
            <router-link to="/guide">
                <el-button type="info" link icon="QuestionFilled">
                   漏洞资料指北
               </el-button>
            </router-link>
        </el-header>
        <router-view></router-view>
    </el-container>
  `
};