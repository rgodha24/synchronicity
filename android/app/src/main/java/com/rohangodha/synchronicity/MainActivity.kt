package com.rohangodha.synchronicity

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavController
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.rohangodha.synchronicity.ui.theme.SynchronicityTheme
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue

class MainActivity : ComponentActivity() {
    private var token: String? by mutableStateOf(null)
    private lateinit var navController: NavHostController

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        token = getTokenFromPrefs()

        setContent {
            SynchronicityTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        App()
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleDeepLink(intent)?.let { newToken ->
            storeToken(newToken)
        }
    }

    @SuppressLint("ApplySharedPref")
    private fun storeToken(newToken: String) {
        val prefs = getSharedPreferences("prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("token", newToken).commit()
        token = newToken
    }

    @SuppressLint("ApplySharedPref")
    private fun deleteToken() {
        val prefs = getSharedPreferences("prefs", Context.MODE_PRIVATE)
        prefs.edit().remove("token").commit()
        token = null
    }

    private fun getTokenFromPrefs(): String? {
        return getSharedPreferences("prefs", Context.MODE_PRIVATE).getString("token", null)
    }

    @Composable
    fun App() {
        navController = rememberNavController()

        NavHost(
            navController = navController,
            startDestination = if (token != null) Screen.HomeScreen.route else Screen.LogInScreen.route
        ) {
            composable(Screen.HomeScreen.route) {
                HomeScreen(navController = navController)
            }
            composable(Screen.LogInScreen.route) {
                LogInScreen(navController = navController)
            }
            composable(
                route = Screen.PlaylistScreen.route,
                arguments = listOf(navArgument("playlistId") { type = NavType.StringType })
            ) { backStackEntry ->
                val playlistId = backStackEntry.arguments?.getString("playlistId")
                if (playlistId != null) {
                    PlaylistScreen(playlistId = playlistId)
                }
            }
        }
    }

    @Composable
    fun PlaylistScreen(playlistId: String) {
        Text(text = "Playlist screen for playlist w/ ID $playlistId")
    }

    @Composable
    fun HomeScreen(navController: NavController) {
        LaunchedEffect(token) {
            if (token == null) {
                navController.navigate(Screen.LogInScreen.route) {
                    popUpTo(Screen.HomeScreen.route) { inclusive = true }
                }
            }
        }

        Column {
            Text(text = "Logged In! token: $token")
            Button(onClick = {
                deleteToken()
            }) {
                Text(text = "Log out")
            }
        }
    }

    @Composable
    fun LogInScreen(navController: NavController) {
        LaunchedEffect(token) {
            if (token != null) {
                navController.navigate(Screen.HomeScreen.route) {
                    popUpTo(Screen.LogInScreen.route) { inclusive = true }
                }
            }
        }

        val context = LocalContext.current

        Button(onClick = { startAuth(context) }) {
            Text(text = "Login with Spotify")
        }
    }
}

fun startAuth(context: Context) {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("http://10.0.2.2:3000/auth/login"))
    context.startActivity(intent)
}

fun handleDeepLink(intent: Intent?): String? {
    Log.i("MainActivity", "trying to handle deeplink")
    intent?.data?.let { uri ->
        if (uri.scheme == "synchronicity" && uri.host == "auth") {
            val token = uri.getQueryParameter("token")
            println(token)
            return token
        }
    }
    return null
}

sealed class Screen(val route: String) {
    data object HomeScreen : Screen("home")
    data object LogInScreen : Screen("login")
    data object PlaylistScreen : Screen("playlist/{playlistId}")
}